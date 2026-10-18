// 사용자 입퇴장,메시지 전송
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { extractUserIdFromToken } from '../utils/jwt.util';
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from '../room/room.service';
import { RedisService } from '../redis/redis.service';
import { Cron } from '@nestjs/schedule';

@WebSocketGateway({
  namespace: '/collab',
  cors: {
    origin: [/^http:\/\/localhost:\d+$/, 'https://wheretoput.store'],
    credentials: true,
  },
})
export class CollabGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CollabGateway.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly roomService: RoomService,
    private readonly redisService: RedisService,
  ) {}

  afterInit() {
    // RoomService에 소켓 서버 인스턴스 전달
    this.roomService.setSocketServer(this.server);
  }

  // 연결/해제 로그
  handleConnection(socket: Socket) {
    this.logger.log(`🟢 CONNECTED: ${socket.id}`);
    this.logger.log(`🔗 Socket connected on namespace: ${socket.nsp.name}`);
    socket.emit('welcome', { id: socket.id, time: new Date().toISOString() });
  }

  async handleDisconnect(socket: Socket) {
    this.logger.log(`🔴 DISCONNECTED: ${socket.id}`);

    // 소켓에 저장된 사용자 정보와 방 ID 확인
    const { userId, userData, roomId } = socket.data || {};

    if (userId && roomId) {
      this.logger.log(
        `🚪 User ${userId} (${userData?.name}) disconnected from room ${roomId}`,
      );

      // 사용자가 잡고 있던 가구 락 해제
      const prevState = await this.redisService.getRoomState(roomId);
      const lockedModelId =
        prevState?.connectedUsers.get(userId)?.selectedModelId;
      if (lockedModelId) {
        await this.redisService.releaseModelLock(roomId, lockedModelId, userId);
      }

      // Redis에서 사용자 정보 직접 제거
      await this.redisService.removeConnectedUser(roomId, userId);
      this.logger.log(`🗑️ User ${userId} removed from Redis`);

      // 방에 남은 사용자 수 확인
      const roomState = await this.redisService.getRoomState(roomId);
      this.logger.log(
        `📊 Remaining users in room: ${roomState?.connectedUsers.size || 0}`,
      );

      // 다른 사용자들에게 퇴장 알림 브로드캐스트 (userData 포함)
      this.server.to(roomId).emit('user-left', {
        userId,
        userData: userData || { name: userId }, // fallback으로 userId 사용
      });
      this.logger.log(`📤 User-left broadcasted to room ${roomId}`);

      // 방이 완전히 비워진 경우 Redis 정리
      if (roomState && roomState.connectedUsers.size === 0) {
        this.logger.log(`🏠 Room ${roomId} became empty, clearing Redis`);

        // Redis에서 방 상태 제거
        await this.redisService.clearRoomState(roomId);
      }
    } else {
      this.logger.log(
        `⚠️ Socket ${socket.id} disconnected but no user/room data found`,
      );
    }
  }

  @SubscribeMessage('join-room')
  async onJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🤝 COLLABORATION JOIN: ${socket.id} → room ${roomId}`);

    const userId = extractUserIdFromToken(
      this.jwtService,
      socket.handshake.auth?.token,
    );

    if (!roomId) throw new BadRequestException('roomId is required');

    // Socket.IO 방에 입장
    void socket.join(roomId);

    // 방의 기존 접속자들에게 새로 입장한 사용자 알림
    socket.to(roomId).emit('request-user-list', { newUserId: socket.id });

    // Redis 상태 조회 및 전송은 user-join 이후로 지연
    socket.emit('joined-room', { roomId, userId });
    this.logger.log(`✅ User ${userId} joined collaboration room: ${roomId}`);
  }

  // 기존 사용자들이 자신의 정보를 응답
  @SubscribeMessage('user-info-response')
  async onUserInfoResponse(
    @MessageBody()
    data: { userId: string; userData: any; targetSocketId: any | undefined },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `📤 Forwarding user info: ${data.userId} → ${data.targetSocketId}`,
    );
    // 새로 입장한 사용자에게 기존 사용자 정보 전달
    this.server.to(data.targetSocketId).emit('user-info-response', {
      userId: data.userId,
      userData: data.userData,
    });
  }

  // 사용자 입장 알림
  @SubscribeMessage('user-join')
  async onUserJoin(
    @MessageBody()
    data: { userId: string; userData: { name: string; color: string } },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`👤 USER JOIN: ${data.userId} (${data.userData.name})`);

    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);

    // 소켓에 사용자 정보와 방 ID 저장 (disconnect 시 사용)
    socket.data = {
      userId: data.userId,
      userData: data.userData,
      roomId: roomId,
    };

    // 동일한 userId가 이미 Redis에 있는지 확인
    let isAlreadyConnected = false;

    if (roomId) {
      let roomState = await this.redisService.getRoomState(roomId);
      isAlreadyConnected = roomState?.connectedUsers.has(data.userId) || false;

      if (isAlreadyConnected) {
        this.logger.log(
          `🔄 User ${data.userId} already connected, disconnecting previous connection`,
        );

        // 기존 연결된 소켓들을 찾아서 강제 퇴장
        const socketsInRoom = await this.server.in(roomId).fetchSockets();
        for (const existingSocket of socketsInRoom) {
          if (
            existingSocket.data?.userId === data.userId &&
            existingSocket.id !== socket.id
          ) {
            this.logger.log(
              `🚪 Disconnecting previous socket ${existingSocket.id} for user ${data.userId}`,
            );

            // 기존 소켓에 퇴장 이벤트 전송
            existingSocket.emit('user-left', {
              userId: data.userId,
              userData: data.userData,
              reason: 'duplicate-connection',
            });

            // 기존 소켓 연결 해제
            existingSocket.disconnect(true);
          }
        }
      }

      // Redis에 사용자 정보 저장 (lastActivity 초기값 포함)
      await this.redisService.updateConnectedUser(roomId, data.userId, {
        ...data.userData,
        lastActivity: Date.now(),
      });

      // Redis에 방 상태가 없다면 DB에서 전체 로드하여 Redis에 저장
      roomState = await this.redisService.getRoomState(roomId);
      if (!roomState || roomState.models.length === 0) {
        this.logger.log(`🔄 Loading room data from DB for room ${roomId}`);

        // DB에서 방의 모든 가구 정보 로드 (furniture 정보 포함)
        const roomData = await this.prisma.room_objects.findMany({
          where: { room_id: roomId },
          include: {
            furnitures: true,
          },
        });

        if (roomData && roomData.length > 0) {
          // DB 가구 데이터를 Redis 모델 형식으로 변환
          const modelsFromDB = roomData.map((obj) => {
            const position = (obj.position as any) ?? { x: 0, y: 0, z: 0 };
            const rotation = (obj.rotation as any) ?? { x: 0, y: 0, z: 0 };
            const scale = (obj.scale as any) ?? { x: 1, y: 1, z: 1 };

            return {
              id: `object-${obj.object_id}`,
              object_id: obj.object_id,
              furniture_id: obj.furniture_id,
              name: obj.furnitures?.name || 'Unknown',
              url: obj.furnitures?.model_url || '',
              position: [position.x, position.y, position.z],
              rotation: [rotation.x, rotation.y, rotation.z],
              scale: [scale.x, scale.y, scale.z],
              length: [
                Number(obj.furnitures?.length_x || 1),
                Number(obj.furnitures?.length_y || 1),
                Number(obj.furnitures?.length_z || 1),
              ],
              brand: obj.furnitures?.brand || '',
              type: 'glb',
            };
          });

          // Redis에 전체 방 상태 저장
          await this.redisService.initializeRoomState(roomId, modelsFromDB);
          roomState = await this.redisService.getRoomState(roomId);
          this.logger.log(
            `✅ Initialized Redis with ${modelsFromDB.length} models from DB`,
          );
        }
      }

      // 최신 방 상태를 새 사용자에게 전송
      if (roomState) {
        socket.emit('initial-room-state', {
          models: roomState.models,
          connectedUsers: Array.from(roomState.connectedUsers.entries()),
          version: roomState.version,
        });
        this.logger.log(
          `📦 Initial room state sent to ${data.userId}: ${roomState.models?.length || 0} models`,
        );
      }
    }

    // 방의 다른 사용자들에게 브로드캐스트 (이미 연결된 사용자는 제외)
    if (roomId && !isAlreadyConnected) {
      socket.to(roomId).emit('user-join', data);
      this.logger.log(`📤 User-join broadcasted to room ${roomId}`);
    } else if (isAlreadyConnected) {
      this.logger.log(
        `⚠️ Skipping broadcast for already connected user ${data.userId}`,
      );
    }
  }

  // 사용자 퇴장 알림 (수동 퇴장 시에만 사용, 자동 단절은 handleDisconnect에서 처리)
  @SubscribeMessage('user-left')
  async onUserLeft(
    @MessageBody() data: { userId: string; userData?: any },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`👋 USER LEFT (manual): ${data.userId}`);
    this.logger.log(`🔍 Socket rooms: ${Array.from(socket.rooms).join(', ')}`);
    this.logger.log(`🆔 Socket ID: ${socket.id}`);

    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    this.logger.log(`🏠 Found room ID: ${roomId || 'NONE'}`);

    if (roomId) {
      this.logger.log(`🏠 Processing manual user-left for room: ${roomId}`);

      // 방의 다른 사용자들에게 브로드캐스트 (수동 퇴장시에만 전송)
      this.logger.log(`📤 Broadcasting user-left to room ${roomId}`);
      socket.to(roomId).emit('user-left', data);
      this.logger.log(`✅ User-left broadcasted successfully`);

      // 수동 퇴장시는 disconnect가 바로 호출되므로 여기서는 Redis 정리만 하지 않음
      // handleDisconnect에서 자동으로 처리됨
    } else {
      this.logger.log(`⚠️ No room found for user-left event`);
    }
  }

  // 모델 이동
  @SubscribeMessage('model-moved')
  async onModelMove(
    @MessageBody()
    data: { userId: string; modelId: string; position: number[] },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`📦 MODEL MOVE: ${data.modelId} by ${data.userId}`);

    // Redis에서 모델 위치 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomModel(roomId, {
        id: data.modelId,
        position: data.position,
      });

      // 락 TTL 연장
      await this.redisService.refreshModelLock(
        roomId,
        data.modelId,
        data.userId,
      );

      // 사용자 활동 시간 업데이트
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    // 방의 다른 사용자들에게 브로드캐스트
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('model-moved', data);
      }
    });
  }

  // 모델 회전
  @SubscribeMessage('model-rotated')
  async onModelRotate(
    @MessageBody()
    data: { userId: string; modelId: string; rotation: number[] },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🔄 MODEL ROTATE: ${data.modelId} by ${data.userId}`);

    // Redis에서 모델 회전 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomModel(roomId, {
        id: data.modelId,
        rotation: data.rotation,
      });

      // 락 TTL 연장
      await this.redisService.refreshModelLock(
        roomId,
        data.modelId,
        data.userId,
      );

      // 사용자 활동 시간 업데이트
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('model-rotated', data);
      }
    });
  }

  // 모델 크기 조정
  @SubscribeMessage('model-scaled')
  async onModelScale(
    @MessageBody() data: { userId: string; modelId: string; scale: number[] },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`📏 MODEL SCALE: ${data.modelId} by ${data.userId}`);

    // Redis에서 모델 스케일 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomModel(roomId, {
        id: data.modelId,
        scale: data.scale,
      });

      // 락 TTL 연장
      await this.redisService.refreshModelLock(
        roomId,
        data.modelId,
        data.userId,
      );

      // 사용자 활동 시간 업데이트
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('model-scaled', data);
      }
    });
  }

  // 모델 추가
  @SubscribeMessage('model-added')
  async onModelAdded(
    @MessageBody() data: { userId: string; modelData: any },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`➕ MODEL ADDED: by ${data.userId}`);

    // Redis에 새 모델 추가
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomModel(roomId, data.modelData);

      // 사용자 활동 시간 업데이트
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('model-added', data);
      }
    });
  }

  // 모델 추가 with ID
  @SubscribeMessage('model-added-with-id')
  async onModelAddedWithID(
    @MessageBody() data: { userId: string; modelData: any },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`➕ MODEL ADDED WITH ID: by ${data.userId}`);

    // Redis에 새 모델 추가
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomModel(roomId, data.modelData);

      // 사용자 활동 시간 업데이트
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('model-added-with-id', data);
      }
    });
  }

  // 모델 제거
  @SubscribeMessage('model-removed')
  async onModelRemoved(
    @MessageBody() data: { userId: string; modelId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`➖ MODEL REMOVED: ${data.modelId} by ${data.userId}`);

    // Redis에서 모델 제거
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.removeRoomModel(roomId, data.modelId);
      await this.redisService.deleteModelLock(roomId, data.modelId);

      // 사용자 활동 시간 업데이트
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('model-removed', data);
      }
    });
  }

  // 모델 선택
  @SubscribeMessage('model-select')
  async onModelSelect(
    @MessageBody() data: { userId: string; modelId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`✅ MODEL SELECT: ${data.modelId} by ${data.userId}`);

    // 가구별 락 키에 SET NX로 원자적 획득 시도
    // lockTimeStamp, lastActivity는 락 시간제한 용도
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      const { acquired, ownerId } = await this.redisService.acquireModelLock(
        roomId,
        data.modelId,
        data.userId,
      );

      if (!acquired) {
        this.logger.log(
          `🔒 MODEL SELECT DENIED: ${data.modelId} is locked by ${ownerId}`,
        );
        socket.emit('model-select-denied', {
          modelId: data.modelId,
          ownerId,
        });
        return;
      }

      // 다른 가구를 선택 중이었다면 이전 락 해제
      const roomState = await this.redisService.getRoomState(roomId);
      const prevModelId = roomState?.connectedUsers.get(
        data.userId,
      )?.selectedModelId;
      if (prevModelId && prevModelId !== data.modelId) {
        await this.redisService.releaseModelLock(
          roomId,
          prevModelId,
          data.userId,
        );
      }

      await this.redisService.updateRoomUser(roomId, data.userId, {
        selectedModelId: data.modelId,
        showTooltip: true,
        tooltipModelId: data.modelId,
        lockTimeStamp: Date.now(),
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('model-select', data);
      }
    });
  }

  // 협업 종료
  @SubscribeMessage('collaboration-ended')
  async onCollaborationEnded(
    @MessageBody() data: { ownerId: string; roomId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🚪 COLLABORATION ENDED for room ${data.roomId}`);
    // 모든 사용자 퇴장 처리
    const roomState = await this.redisService.getRoomState(data.roomId);
    if (roomState) {
      for (const [userId, userData] of roomState.connectedUsers.entries()) {
        await this.redisService.removeConnectedUser(data.roomId, userId);
        // 다른 사용자들에게 퇴장 알림 브로드캐스트 (userData 포함)
        this.server.to(data.roomId).emit('user-left', {
          userId,
          userData: userData || { name: userId }, // fallback으로 userId 사용
          reason: 'collaboration-ended', // 협업 종료로 인한 퇴장임을 명시
        });
      }
    }
    // 레디스에서 방 상태 제거
    await this.redisService.clearRoomState(data.roomId);
  }

  // 모델선택해제
  @SubscribeMessage('model-deselect')
  async onModelDeselect(
    @MessageBody() data: { userId: string; modelId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`✅ MODEL DESELECT: ${data.modelId} by ${data.userId}`);

    // 락 해제 후 현재 사용자 상태 업데이트 (Redis)
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      if (data.modelId) {
        await this.redisService.releaseModelLock(
          roomId,
          data.modelId,
          data.userId,
        );
      }

      await this.redisService.updateRoomUser(roomId, data.userId, {
        selectedModelId: null,
        showTooltip: false,
        tooltipModelId: null,
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('model-deselect', data);
      }
    });
  }

  // 락 타임아웃 (1분에 1번씩 체크)
  // 락 키는 마지막 활동 기준 TTL로 자동 만료되므로, 만료된 사용자의 선택 상태만 정리
  @Cron('0 * * * * *') // 매 분 0초마다 실행
  async cleanupExpiredLocks() {
    this.logger.log('🧹 Running cleanupExpiredLocks cron job');
    const allRooms = await this.redisService.getAllRooms();

    for (const roomId of allRooms) {
      const roomState = await this.redisService.getRoomState(roomId);
      if (roomState) {
        for (const [userId, userData] of roomState.connectedUsers.entries()) {
          if (userData.selectedModelId) {
            const ownerId = await this.redisService.getModelLockOwner(
              roomId,
              userData.selectedModelId,
            );
            if (ownerId !== userId) {
              this.logger.log(
                `🔓 Releasing lock for user ${userId} on ${userData.selectedModelId} (expired)`,
              );

              await this.redisService.updateRoomUser(roomId, userId, {
                selectedModelId: null,
                showTooltip: false,
                tooltipModelId: null,
                lockTimeStamp: null,
              });

              this.server.to(roomId).emit('model-deselect', {
                userId,
                modelId: userData.selectedModelId,
              });
            }
          }
        }
      }
    }
  }

  // 벽 색상 변경
  @SubscribeMessage('wall-color-changed')
  async onWallColorChanged(
    @MessageBody() data: { userId: string; color: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🎨 WALL COLOR CHANGED: ${data.color} by ${data.userId}`);

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('wall-color-changed', data);
      }
    });
  }

  // 바닥 색상 변경
  @SubscribeMessage('floor-color-changed')
  async onFloorColorChanged(
    @MessageBody() data: { userId: string; color: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🎨 FLOOR COLOR CHANGED: ${data.color} by ${data.userId}`);

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('floor-color-changed', data);
      }
    });
  }

  // 배경 색상 변경
  @SubscribeMessage('background-color-changed')
  async onBackgroundColorChanged(
    @MessageBody() data: { userId: string; color: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `🎨 BACKGROUND COLOR CHANGED: ${data.color} by ${data.userId}`,
    );

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('background-color-changed', data);
      }
    });
  }

  // 환경 프리셋 변경
  @SubscribeMessage('environment-preset-changed')
  async onEnvironmentPresetChanged(
    @MessageBody() data: { userId: string; preset: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `🌟 ENVIRONMENT PRESET CHANGED: ${data.preset} by ${data.userId}`,
    );

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('environment-preset-changed', data);
      }
    });
  }

  // 벽 텍스처 변경
  @SubscribeMessage('wall-texture-changed')
  async onWallTextureChanged(
    @MessageBody() data: { userId: string; texture: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `🖼️ WALL TEXTURE CHANGED: ${data.texture} by ${data.userId}`,
    );

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('wall-texture-changed', data);
      }
    });
  }

  // 바닥 텍스처 변경
  @SubscribeMessage('floor-texture-changed')
  async onFloorTextureChanged(
    @MessageBody() data: { userId: string; texture: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `🏠 FLOOR TEXTURE CHANGED: ${data.texture} by ${data.userId}`,
    );

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('floor-texture-changed', data);
      }
    });
  }

  // 벽 추가
  @SubscribeMessage('wall-added')
  async onWallAdded(
    @MessageBody() data: { userId: string; wallData: any },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🧱 WALL ADDED: by ${data.userId}`);

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('wall-added', data);
      }
    });
  }

  // 벽 추가 (ID 포함)
  @SubscribeMessage('wall-added-with-id')
  async onWallAddedWithId(
    @MessageBody() data: { userId: string; wallData: any },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🧱 WALL ADDED WITH ID: by ${data.userId}`);

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('wall-added-with-id', data);
      }
    });
  }

  // 벽 제거
  @SubscribeMessage('wall-removed')
  async onWallRemoved(
    @MessageBody() data: { userId: string; wallId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🗑️ WALL REMOVED: ${data.wallId} by ${data.userId}`);

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('wall-removed', data);
      }
    });
  }

  // 벽 업데이트
  @SubscribeMessage('wall-updated')
  async onWallUpdated(
    @MessageBody() data: { userId: string; wallId: string; updates: any },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`🔧 WALL UPDATED: ${data.wallId} by ${data.userId}`);

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('wall-updated', data);
      }
    });
  }

  // 원본 텍스처 사용 변경
  @SubscribeMessage('use-original-texture-changed')
  async onUseOriginalTextureChanged(
    @MessageBody() data: { userId: string; use: boolean },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `🖼️ USE ORIGINAL TEXTURE CHANGED: ${data.use} by ${data.userId}`,
    );

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('use-original-texture-changed', data);
      }
    });
  }

  // 원본 벽 텍스처 사용 변경
  @SubscribeMessage('use-original-wall-texture-changed')
  async onUseOriginalWallTextureChanged(
    @MessageBody() data: { userId: string; use: boolean },
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `🧱 USE ORIGINAL WALL TEXTURE CHANGED: ${data.use} by ${data.userId}`,
    );

    // 사용자 활동 시간 업데이트
    const roomId = Array.from(socket.rooms).find((room) => room !== socket.id);
    if (roomId) {
      await this.redisService.updateRoomUser(roomId, data.userId, {
        lastActivity: Date.now(),
      });
    }

    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit('use-original-wall-texture-changed', data);
      }
    });
  }

  // 미활동 사용자 연결해제
  // @Cron('0 */5 * * * *') // 5분에 1번씩 실행
  // async cleanupInactiveUsers() {
  //   this.logger.log('🧹 Checking for inactive users');
  //   const allRooms = await this.redisService.getAllRooms();
  //   const now = Date.now();
  //   const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5분

  //   for (const roomId of allRooms) {
  //     const roomState = await this.redisService.getRoomState(roomId);
  //     if (roomState) {
  //       for (const [userId, userData] of roomState.connectedUsers.entries()) {
  //         if (!userData.lastActivity) {
  //           userData.lastActivity = now;
  //         } else if (now - userData.lastActivity > INACTIVE_TIMEOUT) {
  //           // 비활성 사용자 퇴장 처리
  //           await this.redisService.removeConnectedUser(roomId, userId);

  //           // 다른 사용자들에게 퇴장 알림 브로드캐스트 (userData 포함)
  //           this.server.to(roomId).emit('user-left', {
  //             userId,
  //             userData: userData || { name: userId }, // fallback으로 userId 사용,
  //             reason: 'time-out', // 시간 종료로 인한 퇴장임을 명시
  //           });

  //           this.logger.log(
  //             `⏰Kicked inactive user ${userId} from room ${roomId}`,
  //           );
  //         }
  //       }
  //     }
  //   }
  // }
}
