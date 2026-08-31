// Redis has been removed from this project.
// This stub maintains the same exported interface for any files not yet cleaned up.
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  async get<T>(_key: string): Promise<T | undefined> { return undefined; }
  async set(_key: string, _value: unknown, _ttl?: number): Promise<void> {}
  async del(_key: string): Promise<void> {}
  async ping(): Promise<{ status: string; latencyMs: number }> { return { status: 'REMOVED', latencyMs: 0 }; }
  async setSession(_userId: string, _sessionId: string, _data: any): Promise<void> {}
  async getSession(_userId: string, _sessionId: string): Promise<any> { return null; }
  async deleteSession(_userId: string, _sessionId: string): Promise<void> {}
  async deleteUserSessions(_userId: string): Promise<void> {}
  async incrementAndGet(_key: string, _ttl?: number): Promise<number> { return 0; }
}
