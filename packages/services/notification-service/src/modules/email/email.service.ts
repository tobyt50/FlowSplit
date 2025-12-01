import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  title: string;
  body: string;
  actionText?: string;
  actionUrl?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Configure Transport (Support for Gmail, SendGrid, SES, or Ethereal)
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendHtmlEmail({ to, subject, title, body, actionText, actionUrl }: SendEmailOptions) {
    const htmlContent = this.generateHtmlTemplate(title, body, actionText, actionUrl);

    try {
      const info = await this.transporter.sendMail({
        from: `"FlowSplit Security" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
        to,
        subject,
        html: htmlContent,
      });
      this.logger.log(`Email sent to ${to}. MessageId: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      // In production, we might push this to a Dead Letter Queue
    }
  }

  // A simple, robust HTML email generator. 
  // In a larger team, use 'react-email' or Handlebars.
  private generateHtmlTemplate(title: string, body: string, actionText?: string, actionUrl?: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
          <h2 style="color: #0F766E; margin: 0;">FlowSplit</h2>
        </div>
        <div style="padding: 20px 0;">
          <h3 style="color: #333;">${title}</h3>
          <p style="color: #555; line-height: 1.6;">${body}</p>
          ${actionText && actionUrl ? `
            <div style="text-align: center; margin-top: 30px;">
              <a href="${actionUrl}" style="background-color: #0F766E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ${actionText}
              </a>
            </div>
          ` : ''}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} FlowSplit Financial. All rights reserved.</p>
        </div>
      </div>
    `;
  }
}