import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RedisModule } from '../redis/redis.module';
import { MailService } from '../common/mail.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), RedisModule],
  providers: [AuthService, JwtStrategy, MailService],
  controllers: [AuthController],
  exports: [PassportModule, MailService],
})
export class AuthModule {}
