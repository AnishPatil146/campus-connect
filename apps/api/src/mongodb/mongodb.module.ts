import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { MongoDbService } from './mongodb.service';
import { MongoAuditLog, MongoAuditLogSchema } from './schemas/audit-log.schema';
import { SystemTelemetry, SystemTelemetrySchema } from './schemas/system-telemetry.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isTest = process.env.NODE_ENV === 'test';
        const isEnabled = configService.get('MONGODB_ENABLED') ?? (process.env.MONGODB_ENABLED === 'true');
        const rawUri =
          configService.get('MONGODB_URI') ||
          process.env.MONGODB_URI ||
          'mongodb://localhost:27017/campus_connect_aux';
        const rawDbName =
          configService.get('MONGODB_DB_NAME') || process.env.MONGODB_DB_NAME || 'campus_connect_aux';

        const uri: string = String(rawUri);
        const dbName: string = String(rawDbName);

        const hasPlaceholders = uri.includes('<db_username>') || uri.includes('<db_password>');
        if (hasPlaceholders && !isTest) {
          console.warn(
            '⚠️ [MongoDB] Placeholder <db_username>/<db_password> detected in MONGODB_URI. Update .env with actual Atlas credentials.',
          );
        }

        // In test mode or when disabled, use fast timeout and disable buffering to prevent hanging
        const timeoutMs = isTest || !isEnabled ? 500 : 5000;

        return {
          uri: hasPlaceholders ? 'mongodb://localhost:27017/campus_connect_aux' : uri,
          dbName,
          serverSelectionTimeoutMS: timeoutMs,
          connectTimeoutMS: timeoutMs,
          retryWrites: true,
          w: 'majority' as const,
          autoIndex: !isTest,
          bufferCommands: !isTest,
        };
      },
    }),
    MongooseModule.forFeature([
      { name: MongoAuditLog.name, schema: MongoAuditLogSchema },
      { name: SystemTelemetry.name, schema: SystemTelemetrySchema },
    ]),
  ],
  providers: [MongoDbService],
  exports: [MongoDbService, MongooseModule],
})
export class MongoDatabaseModule {}
