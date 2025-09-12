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
  async updateRoomUser(roomId: string, userId: string, userData: any): Promise<RoomState> {
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
    console.log(`🔴 Room ${roomId} state cleared from Redis`);
  }
}
