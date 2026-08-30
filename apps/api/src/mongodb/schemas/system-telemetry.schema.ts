import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type SystemTelemetryDocument = HydratedDocument<SystemTelemetry>;

@Schema({
  collection: 'system_telemetry',
  timestamps: true,
})
export class SystemTelemetry {
  @Prop({ type: String, required: true, index: true })
  node!: string;

  @Prop({ type: String, required: true })
  status!: string;

  @Prop({ type: Number, required: true })
  memoryUsageMb!: number;

  @Prop({ type: Number, required: true })
  cpuPercent!: number;

  @Prop({ type: Number, default: 0 })
  activeSessions!: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  diagnostics!: Record<string, any>;

  @Prop({ type: Date, default: Date.now, expires: '30d', index: true })
  recordedAt!: Date;
}

export const SystemTelemetrySchema = SchemaFactory.createForClass(SystemTelemetry);
