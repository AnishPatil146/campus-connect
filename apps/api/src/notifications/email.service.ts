import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const user = process.env.GMAIL_USER || 'noreply.campusconnect.edu@gmail.com';
    const pass = process.env.GMAIL_APP_PASSWORD || 'mock_app_password';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    const mailOptions = {
      from: '"Campus Connect Auth" <noreply.campusconnect.edu@gmail.com>',
      to,
      subject: 'Campus Connect - Email Verification OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb;">Campus Connect Email Verification</h2>
          <p>Your one-time email verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #1e40af; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
            This code will expire in 10 minutes. If you did not request this verification code, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      if (process.env.NODE_ENV !== 'production' && !process.env.GMAIL_APP_PASSWORD) {
        this.logger.log(`[MOCK EMAIL OTP] Sent to ${to}: Code ${otp}`);
        return true;
      }
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP Email successfully delivered to ${to}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send OTP email to ${to}: ${err.message}`);
      this.logger.log(`[DEV FALLBACK OTP] Code for ${to}: ${otp}`);
      return true;
    }
  }

  async sendAttendanceAlert(to: string, studentName: string, date: string, status: string): Promise<boolean> {
    const mailOptions = {
      from: '"Campus Connect Attendance" <noreply.campusconnect.edu@gmail.com>',
      to,
      subject: `Attendance Update for ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h3>Campus Connect Attendance Alert</h3>
          <p>Student <strong>${studentName}</strong> attendance status for <strong>${date}</strong> is marked as: <strong>${status}</strong>.</p>
        </div>
      `,
    };
    try {
      if (process.env.GMAIL_APP_PASSWORD) {
        await this.transporter.sendMail(mailOptions);
      } else {
        this.logger.log(`[MOCK ATTENDANCE ALERT] ${studentName} (${date}): ${status}`);
      }
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send attendance alert: ${err.message}`);
      return false;
    }
  }
}
