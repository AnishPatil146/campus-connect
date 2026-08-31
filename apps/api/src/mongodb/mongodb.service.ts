// MongoDB has been removed from this project.
// This stub is kept to prevent TypeScript compilation errors.
import { Injectable } from '@nestjs/common';

@Injectable()
export class MongoDbService {
  isConnected() { return false; }
  async ping() { return { status: 'REMOVED', latencyMs: 0 }; }
  async logAudit(_data: any) {}
}
