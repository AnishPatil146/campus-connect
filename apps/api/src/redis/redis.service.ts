import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {

  // TTL constants (seconds)
  static readonly TTL_SESSION = 24 * 60 * 60;       // 24 hours
  static readonly TTL_OTP = 5 * 60;                  // 5 minutes
  static readonly TTL_DASHBOARD = 5 * 60;            // 5 minutes
  static readonly TTL_ADMIN_DASHBOARD = 2 * 60;      // 2 minutes
  static readonly TTL_LEADERBOARD = 10 * 60;         // 10 minutes
  static readonly TTL_ATTENDANCE_ANALYTICS = 15 * 60; // 15 minutes

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // --- Generic Cache Helpers --------------------------------------------------

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const options = ttlSeconds !== undefined ? { ttl: ttlSeconds * 1000 } : undefined;
    await this.cacheManager.set(key, value, options as any);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await (this.cacheManager as any).reset();
  }

  async incrementAndGet(key: string, ttlSeconds: number): Promise<number> {
    const current = await this.get<number>(key);
    const newVal = (current || 0) + 1;
    await this.set(key, newVal, ttlSeconds);
    return newVal;
  }

  // --- Ping / Health ----------------------------------------------------------

  async ping(): Promise<{ status: string; latencyMs: number }> {
    const start = Date.now();
    const testKey = '__health_ping__';
    await this.cacheManager.set(testKey, 'pong', { ttl: 5000 } as any);
    const result = await this.cacheManager.get(testKey);
    await this.cacheManager.del(testKey);

    if (result !== 'pong') {
      throw new Error('Redis ping roundtrip failed: unexpected value returned');
    }

    return { status: 'UP', latencyMs: Date.now() - start };
  }

  // --- Session Storage --------------------------------------------------------

  private sessionKey(userId: string, sessionId: string): string {
    return `session:${userId}:${sessionId}`;
  }

  async setSession(
    userId: string,
    sessionId: string,
    payload: Record<string, unknown>,
    ttlSeconds = RedisService.TTL_SESSION,
  ): Promise<void> {
    await this.set(this.sessionKey(userId, sessionId), payload, ttlSeconds);
  }

  async getSession(
    userId: string,
    sessionId: string,
  ): Promise<Record<string, unknown> | undefined> {
    return this.get<Record<string, unknown>>(this.sessionKey(userId, sessionId));
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    await this.del(this.sessionKey(userId, sessionId));
  }

  // --- OTP Storage ------------------------------------------------------------

  private otpKey(email: string): string {
    return `otp:${email.toLowerCase()}`;
  }

  async setOtp(email: string, hashedOtp: string): Promise<void> {
    await this.set(this.otpKey(email), hashedOtp, RedisService.TTL_OTP);
  }

  async getOtp(email: string): Promise<string | undefined> {
    return this.get<string>(this.otpKey(email));
  }

  async deleteOtp(email: string): Promise<void> {
    await this.del(this.otpKey(email));
  }

  // --- Dashboard Cache --------------------------------------------------------

  private dashboardKey(role: string, entityId: string): string {
    return `dashboard:${role}:${entityId}`;
  }

  async setDashboard(
    role: string,
    entityId: string,
    data: unknown,
    ttlSeconds?: number,
  ): Promise<void> {
    const ttl =
      ttlSeconds ??
      (role === 'ADMIN' ? RedisService.TTL_ADMIN_DASHBOARD : RedisService.TTL_DASHBOARD);
    await this.set(this.dashboardKey(role, entityId), data, ttl);
  }

  async getDashboard(
    role: string,
    entityId: string,
  ): Promise<unknown | undefined> {
    return this.get(this.dashboardKey(role, entityId));
  }

  async invalidateDashboard(role: string, entityId: string): Promise<void> {
    await this.del(this.dashboardKey(role, entityId));
  }
}
