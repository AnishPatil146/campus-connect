import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MongoAuditLogDocument = HydratedDocument<MongoAuditLog>;

@Schema({
  collection: 'audit_logs',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class MongoAuditLog {
  @Prop({ type: String, default: null, index: true })
  userId?: string | null;

  @Prop({ type: String, required: true, index: true })
  userName!: string;

  @Prop({ type: String, required: true, index: true })
  role!: string;

  @Prop({ type: String, required: true, index: true })
  action!: string;

  @Prop({ type: String })
  details?: string;

  @Prop({ type: String, index: true })
  module?: string;

  @Prop({ type: String, index: true })
  entityType?: string;

  @Prop({ type: String, index: true })
  entityId?: string;

  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp!: Date;
}

export const MongoAuditLogSchema = SchemaFactory.createForClass(MongoAuditLog);

// Compound index for timeline queries
MongoAuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
MongoAuditLogSchema.index({ userId: 1, timestamp: -1 });
MongoAuditLogSchema.index({ module: 1, action: 1, timestamp: -1 });
