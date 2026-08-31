import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailService } from '../common/mail.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), NotificationsModule],
  providers: [AuthService, JwtStrategy, MailService],
  controllers: [AuthController],
  exports: [PassportModule, MailService, AuthService],
})
export class AuthModule {}
