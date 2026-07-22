import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || process.env.EMAIL_USER || '';
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`📧 MailService initialized with SMTP server ${host}:${port} (${user})`);
    } else {
      // Fallback transport for development / testing when SMTP is not configured
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      this.logger.log('📧 MailService initialized in JSON/Logger mode (Set SMTP_USER & SMTP_PASS in .env for real delivery)');
    }
  }

  async sendMail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    try {
      const from = process.env.SMTP_FROM || '"Campus Connect Portal" <noreply@campusconnect.com>';
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
      });

      this.logger.log(`📬 Email sent successfully to ${to} [MessageID: ${info?.messageId || 'sent'}, Subject: "${subject}"]`);
      return true;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send email to ${to}: ${error.message || error}`);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, name: string = 'User'): Promise<boolean> {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/login?resetToken=${resetToken}&email=${encodeURIComponent(email)}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">Campus Connect</h1>
        </div>
        <div style="padding: 24px 8px;">
          <h2 style="color: #1e293b; font-size: 18px;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 14px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #475569; font-size: 14px;">We received a request to reset your Campus Connect account password. Click the button below to set up a new password:</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Reset My Password</a>
          </div>

          <p style="color: #64748b; font-size: 12px;">Alternatively, your verification OTP code is: <strong style="font-size: 16px; color: #0f172a;">${resetToken.slice(0, 6)}</strong></p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        <div style="border-t: 1px solid #f1f5f9; padding-top: 12px; text-align: center; color: #94a3b8; font-size: 11px;">
          Campus Connect Smart Campus Portal • © 2026
        </div>
      </div>
    `;

    return this.sendMail(email, '🔑 Reset Your Campus Connect Password', html);
  }

  async sendWelcomeEmail(email: string, name: string, role: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">Campus Connect</h1>
        </div>
        <div style="padding: 24px 8px;">
          <h2 style="color: #1e293b; font-size: 18px;">Welcome to Campus Connect!</h2>
          <p style="color: #475569; font-size: 14px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #475569; font-size: 14px;">Your profile has been created successfully as a <strong>${role}</strong>.</p>
          <p style="color: #475569; font-size: 14px;">You can now log in using your registered email: <strong>${email}</strong> or via Google Sign-In.</p>
        </div>
        <div style="border-t: 1px solid #f1f5f9; padding-top: 12px; text-align: center; color: #94a3b8; font-size: 11px;">
          Campus Connect Smart Campus Portal • © 2026
        </div>
      </div>
    `;

    return this.sendMail(email, '🎉 Welcome to Campus Connect!', html);
  }

  async sendNotificationEmail(email: string, title: string, content: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">Campus Connect Notification</h1>
        </div>
        <div style="padding: 24px 8px;">
          <h2 style="color: #1e293b; font-size: 16px;">${title}</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">${content}</p>
        </div>
        <div style="border-t: 1px solid #f1f5f9; padding-top: 12px; text-align: center; color: #94a3b8; font-size: 11px;">
          Campus Connect Smart Campus Portal • © 2026
        </div>
      </div>
    `;

    return this.sendMail(email, `🔔 ${title}`, html);
  }
}
