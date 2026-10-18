import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

export interface RoomState {
  models: any[];
  connectedUsers: Map<string, any>;
  lastUpdated: number;
  version: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private dummyStorage = new Map<string, RoomState>(); // 더미 저장소

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = createClient({ url: redisUrl });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await this.client.connect();
    console.log('🔴 Redis connected');
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
      console.log('🔴 Redis disconnected');
    }
  }

  // 방 상태 저장
  async setRoomState(roomId: string, state: RoomState): Promise<void> {
    const key = `room:${roomId}:state`;
    await this.client.hSet(key, {
      models: JSON.stringify(state.models),
      connectedUsers: JSON.stringify(
        Array.from(state.connectedUsers.entries()),
      ),
      lastUpdated: state.lastUpdated.toString(),
      version: state.version.toString(),
    });

    // 마지막 수정으로부터 24시간 후 삭제
    await this.client.expire(key, 24 * 60 * 60);
    console.log(`🔴 Room state updated in Redis for room ${roomId}`);
  }

  // 방 상태 조회
  async getRoomState(roomId: string): Promise<RoomState | null> {
    const key = `room:${roomId}:state`;
    const data = await this.client.hGetAll(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    console.log(`🔴 Room state checked ${roomId}`);
    return {
      models: JSON.parse(data.models || '[]'),
      connectedUsers: new Map(JSON.parse(data.connectedUsers || '[]')),
      lastUpdated: parseInt(data.lastUpdated || '0'),
      version: parseInt(data.version || '0'),
    };
  }

  // 모든 방
  async getAllRooms(): Promise<string[]> {
    const keys = await this.client.keys('room:*:state');
    return keys.map((key) => key.split(':')[1]);
  }

  // 모델 추가/업데이트
  async updateRoomModel(roomId: string, model: any): Promise<RoomState> {
    const currentState = (await this.getRoomState(roomId)) || {
      models: [] as any[],
      connectedUsers: new Map(),
      lastUpdated: Date.now(),
      version: 0,
    };

    // 기존 모델 찾기
    const existingIndex = currentState.models.findIndex(
      (m) => m.id === model.id,
    );

    if (existingIndex >= 0) {
      // 업데이트
      currentState.models[existingIndex] = {
        ...currentState.models[existingIndex],
        ...model,
      };
    } else {
      // 새 모델 추가
      currentState.models.push(model);
    }

    const newState: RoomState = {
      ...currentState,
      lastUpdated: Date.now(),
      version: currentState.version + 1,
    };

    await this.setRoomState(roomId, newState);
    return newState;
  }

  // 🆕 사용자 상태 업데이트 메서드
  async updateRoomUser(
    roomId: string,
    userId: string,
    userData: any,
  ): Promise<RoomState> {
    const currentState = (await this.getRoomState(roomId)) || {
      models: [] as any[],
      connectedUsers: new Map(),
      lastUpdated: Date.now(),
      version: 0,
    };

    // 기존 사용자 데이터와 병합
    const existingUser = currentState.connectedUsers.get(userId) || {};
    currentState.connectedUsers.set(userId, { ...existingUser, ...userData });

    const newState: RoomState = {
      ...currentState,
      lastUpdated: Date.now(),
      version: currentState.version + 1,
    };

    await this.setRoomState(roomId, newState);
    return newState;
  }

  // 모델 제거
  async removeRoomModel(roomId: string, modelId: string): Promise<RoomState> {
    const currentState = (await this.getRoomState(roomId)) || {
      models: [],
      connectedUsers: new Map(),
      lastUpdated: Date.now(),
      version: 0,
    };

    const newState: RoomState = {
      ...currentState,
      models: currentState.models.filter((m) => m.id !== modelId),
      lastUpdated: Date.now(),
      version: currentState.version + 1,
    };

    await this.setRoomState(roomId, newState);
    return newState;
  }

  // 사용자 추가/업데이트
  async updateConnectedUser(
    roomId: string,
    userId: string,
    userData: any,
  ): Promise<void> {
    const currentState = (await this.getRoomState(roomId)) || {
      models: [],
      connectedUsers: new Map(),
      lastUpdated: Date.now(),
      version: 0,
    };

    currentState.connectedUsers.set(userId, userData);

    const newState: RoomState = {
      ...currentState,
      lastUpdated: Date.now(),
      version: currentState.version + 1,
    };

    await this.setRoomState(roomId, newState);
  }

  // 사용자 제거
  async removeConnectedUser(roomId: string, userId: string): Promise<void> {
    const currentState = await this.getRoomState(roomId);
    if (!currentState) return;

    currentState.connectedUsers.delete(userId);

    const newState: RoomState = {
      ...currentState,
      lastUpdated: Date.now(),
      version: currentState.version + 1,
    };

    await this.setRoomState(roomId, newState);
  }

  // 방 상태 초기화 (DB 데이터로)
  async initializeRoomState(roomId: string, models: any[]): Promise<RoomState> {
    const newState: RoomState = {
      models,
      connectedUsers: new Map(),
      lastUpdated: Date.now(),
      version: 1,
    };

    await this.setRoomState(roomId, newState);
    console.log(
      `🔴 Room ${roomId} initialized with ${models.length} models from DB`,
    );
    return newState;
  }

  // 방 상태 완전 제거
  async clearRoomState(roomId: string): Promise<void> {
    const key = `room:${roomId}:state`;
    await this.client.del(key);
    await this.clearRoomLocks(roomId);
    console.log(`🔴 Room ${roomId} state cleared from Redis`);
  }

  // ===== 가구 락 (가구별 개별 키, SET NX로 원자적 획득) =====

  private lockKey(roomId: string, modelId: string): string {
    return `room:${roomId}:lock:${modelId}`;
  }

  // 락 획득: 비어 있으면 SET NX로 획득, 이미 내 락이면 TTL 연장
  // 반환값: 성공 여부와 현재 락 소유자
  async acquireModelLock(
    roomId: string,
    modelId: string,
    userId: string,
  ): Promise<{ acquired: boolean; ownerId: string | null }> {
    const key = this.lockKey(roomId, modelId);
    const result = await this.client.set(key, userId, {
      condition: 'NX',
      expiration: { type: 'PX', value: MODEL_LOCK_TTL_MS },
    });
    if (result === 'OK') {
      return { acquired: true, ownerId: userId };
    }

    // 이미 내가 가진 락이면 TTL만 연장 (재선택)
    if (await this.refreshModelLock(roomId, modelId, userId)) {
      return { acquired: true, ownerId: userId };
    }

    return { acquired: false, ownerId: await this.client.get(key) };
  }

  // 락 해제: 내 락일 때만 삭제 (compare-and-delete)
  async releaseModelLock(
    roomId: string,
    modelId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.client.eval(RELEASE_LOCK_SCRIPT, {
      keys: [this.lockKey(roomId, modelId)],
      arguments: [userId],
    });
    return result === 1;
  }

  // 락 TTL 연장: 내 락일 때만 (이동/회전/스케일 등 활동 시)
  async refreshModelLock(
    roomId: string,
    modelId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.client.eval(REFRESH_LOCK_SCRIPT, {
      keys: [this.lockKey(roomId, modelId)],
      arguments: [userId, MODEL_LOCK_TTL_MS.toString()],
    });
    return result === 1;
  }

  // 현재 락 소유자 조회
  async getModelLockOwner(
    roomId: string,
    modelId: string,
  ): Promise<string | null> {
    return this.client.get(this.lockKey(roomId, modelId));
  }

  // 가구 삭제 시 락 강제 제거
  async deleteModelLock(roomId: string, modelId: string): Promise<void> {
    await this.client.del(this.lockKey(roomId, modelId));
  }

  // 방의 모든 락 제거
  async clearRoomLocks(roomId: string): Promise<void> {
    const keys: string[] = [];
    for await (const batch of this.client.scanIterator({
      MATCH: `room:${roomId}:lock:*`,
      COUNT: 100,
    })) {
      keys.push(...batch);
    }
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}

// 락 유지 시간 (마지막 활동 기준 1분)
export const MODEL_LOCK_TTL_MS = 60 * 1000;

const RELEASE_LOCK_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

const REFRESH_LOCK_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('PEXPIRE', KEYS[1], ARGV[2])
end
return 0
`;
