import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AlertItem {
  subject: string;
  recipientEmail: string;
  recipientName: string;
  htmlBody: string;
}

export class ReminderService {
  private static transporter: nodemailer.Transporter | null = null;

  // Initialize Ethereal or configure standard transporter
  private static async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    // Use test SMTP account from Ethereal for local debugging
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logger.info(`[Reminder Service] Ethereal SMTP transporter configured. Debug user: ${testAccount.user}`);
    } catch (error) {
      logger.error(`[Reminder Service] Error creating Ethereal SMTP transporter: ${error}`);
      // Fallback local mock transporter
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }

    return this.transporter;
  }

  // Compile reusable styled HTML email templates
  private static compileEmailTemplate(title: string, message: string, detailLabel: string, detailVal: string, daysLeft: number): string {
    const daysText = daysLeft === 1 ? '1 day' : `${daysLeft} days`;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>TransitOps Expiry Notification</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
          .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: bold; color: #0f172a; }
          .logo-highlight { color: #3b82f6; }
          .title { font-size: 20px; font-weight: 800; color: #ef4444; margin-top: 0; }
          .message { font-size: 15px; line-height: 1.6; color: #334155; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
          .card-row { display: flex; margin-bottom: 8px; font-size: 14px; }
          .card-row:last-child { margin-bottom: 0; }
          .label { font-weight: bold; width: 150px; color: #64748b; }
          .value { font-weight: 600; color: #0f172a; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px dashed #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Transit<span class="logo-highlight">Ops</span> Notification</div>
          </div>
          <h2 class="title">${title}</h2>
          <p class="message">${message}</p>
          <div class="card">
            <div class="card-row">
              <div class="label">${detailLabel}:</div>
              <div class="value">${detailVal}</div>
            </div>
            <div class="card-row">
              <div class="label">Expiry Interval:</div>
              <div class="value">${daysText} remaining</div>
            </div>
          </div>
          <p class="message">Please update this document or complete the schedule inside the TransitOps terminal to avoid operational delays.</p>
          <div class="footer">
            <p>This is an automated operational notification from SwiftHaul Logistics TransitOps system.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Scan and trigger all reminders for 30, 15, 7, and 1 days intervals
  public static async scanAndSendReminders(): Promise<void> {
    logger.info('[Reminder Service] Starting active document expiry scan...');
    const intervals = [30, 15, 7, 1];
    const alertsToSend: AlertItem[] = [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const days of intervals) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + days);

      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      // 1. Check Driver License Expirations
      const drivers = await prisma.driver.findMany({
        where: {
          licenseExpiry: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: { user: true },
      });

      drivers.forEach((d) => {
        alertsToSend.push({
          subject: `⚠️ Urgent: Driver License Expiring in ${days} days - ${d.user.firstName} ${d.user.lastName}`,
          recipientEmail: d.user.email,
          recipientName: `${d.user.firstName} ${d.user.lastName}`,
          htmlBody: this.compileEmailTemplate(
            'Driver License Expiring Soon',
            `Hello ${d.user.firstName}, your commercial driver license (${d.licenseNumber}) is set to expire soon.`,
            'License Number',
            d.licenseNumber,
            days
          ),
        });
      });

      // 2. Check Vehicle Document Expirations (RC, INSURANCE, PUC, FITNESS, PERMIT)
      const documents = await prisma.document.findMany({
        where: {
          expiryDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: { vehicle: true },
      });

      documents.forEach((doc) => {
        alertsToSend.push({
          subject: `⚠️ Alert: Vehicle ${doc.type} Expiring in ${days} days - ${doc.vehicle.registrationNumber}`,
          recipientEmail: 'admin@transitops.com', // Sent to administrator inbox
          recipientName: 'Fleet Management Admin',
          htmlBody: this.compileEmailTemplate(
            `Vehicle Certificate Expiration (${doc.type})`,
            `The ${doc.type} certificate for fleet unit ${doc.vehicle.make} ${doc.vehicle.model.split(' (')[0]} is set to expire.`,
            'Vehicle Plate',
            doc.vehicle.registrationNumber,
            days
          ),
        });
      });

      // 3. Check Scheduled/Open Maintenance Logs
      const maintenanceLogs = await prisma.maintenanceLog.findMany({
        where: {
          status: 'OPEN',
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: { vehicle: true },
      });

      maintenanceLogs.forEach((log) => {
        alertsToSend.push({
          subject: `🔧 Reminder: Maintenance Due in ${days} days - ${log.vehicle.registrationNumber}`,
          recipientEmail: 'admin@transitops.com',
          recipientName: 'Fleet Maintenance Admin',
          htmlBody: this.compileEmailTemplate(
            'Operational Maintenance Schedule Due',
            `The maintenance service request for vehicle ${log.vehicle.registrationNumber} is scheduled for checkup.`,
            'Description',
            log.description,
            days
          ),
        });
      });
    }

    if (alertsToSend.length === 0) {
      logger.info('[Reminder Service] Expiry scan complete. 0 documents expiring in target intervals.');
      return;
    }

    logger.info(`[Reminder Service] Scanned ${alertsToSend.length} expiring items. Dispatching emails...`);
    const transporter = await this.getTransporter();

    for (const alert of alertsToSend) {
      try {
        const info = await transporter.sendMail({
          from: '"TransitOps Reminders" <no-reply@transitops.com>',
          to: alert.recipientEmail,
          subject: alert.subject,
          html: alert.htmlBody,
        });

        // If using test Ethereal account, log preview URL
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info(`[Reminder Service] Sent alert successfully. Preview: ${previewUrl}`);
        } else {
          logger.info(`[Reminder Service] Alert sent to ${alert.recipientEmail}`);
        }
      } catch (err) {
        logger.error(`[Reminder Service] Failed to send reminder email to ${alert.recipientEmail}: ${err}`);
      }
    }
  }

  // Set up daily interval check loop
  public static startDailyInterval(): void {
    // Run initial scan immediately on server start
    this.scanAndSendReminders().catch((err) => {
      logger.error(`[Reminder Service] Initial scan failed: ${err}`);
    });

    // Scan once every 24 hours
    const dailyMs = 24 * 60 * 60 * 1000;
    setInterval(() => {
      this.scanAndSendReminders().catch((err) => {
        logger.error(`[Reminder Service] Cron scan failed: ${err}`);
      });
    }, dailyMs);
    
    logger.info('[Reminder Service] Automatic expiry cron monitoring active.');
  }
}
export default ReminderService;
