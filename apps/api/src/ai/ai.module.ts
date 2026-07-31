import { Module, Global } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  imports: [AuditModule],
  providers: [OllamaService],
  exports: [OllamaService],
})
export class AiModule {}
