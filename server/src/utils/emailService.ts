import nodemailer from 'nodemailer';
import { config } from '../config/env';
import logger from '../config/logger';

// ─── Transporter (lazy-init, reusable) ───────────────────────────────────────

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
    if (!config.smtp.user || !config.smtp.pass) {
        return null; // SMTP not configured — skip silently
    }
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.port === 465,
            auth: {
                user: config.smtp.user,
                pass: config.smtp.pass,
            },
        });
    }
    return transporter;
}

// ─── Generic send helper ─────────────────────────────────────────────────────

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
    const t = getTransporter();
    if (!t) {
        logger.debug(`📧 Email skipped (SMTP not configured): ${subject}`);
        return false;
    }
    try {
        await t.sendMail({ from: config.smtp.from, to, subject, html });
        logger.info(`📧 Email sent to ${to}: ${subject}`);
        return true;
    } catch (err) {
        logger.error(`��� Email failed to ${to}:`, err);
        return false;
    }
}

// ─── Shared HTML wrapper ─────────────────────────────────────────────────────

function wrap(body: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#b71c1c,#e53935);padding:24px 32px;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">🩸 LifeLink</h1>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px">
        ${body}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:20px 32px;background:#fafafa;text-align:center;border-top:1px solid #f0f0f0">
        <p style="margin:0;font-size:12px;color:#aaa">
          You're receiving this because you have an account on LifeLink.<br>
          Every drop counts. Thank you for being part of our community.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Notification-specific emails ────────────────────────────────────────────

/**
 * Donor accepted a blood request → email the requester
 */
export async function emailDonorAccepted(
    requesterEmail: string,
    requesterName: string,
    donorName: string,
    donorBloodGroup: string,
    donorContact: string,
    patientName: string,
    bloodGroup: string,
) {
    const html = wrap(`
        <h2 style="margin:0 0 8px;color:#15803d;font-size:20px">✅ A Donor Accepted Your Request!</h2>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
          Hi <b>${requesterName}</b>, great news — a compatible donor has agreed to help.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:20px">
          <tr><td style="padding:16px">
            <p style="margin:0 0 10px;font-size:13px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Donor Details</p>
            <table cellpadding="4" cellspacing="0">
              <tr><td style="color:#888;font-size:13px;padding-right:12px">Name</td><td style="color:#1a1c1d;font-weight:700;font-size:14px">${donorName}</td></tr>
              <tr><td style="color:#888;font-size:13px;padding-right:12px">Blood Group</td><td><span style="background:#b71c1c;color:#fff;padding:2px 10px;border-radius:20px;font-weight:800;font-size:13px">${donorBloodGroup}</span></td></tr>
              <tr><td style="color:#888;font-size:13px;padding-right:12px">Contact</td><td style="color:#1a1c1d;font-weight:700;font-size:14px">${donorContact}</td></tr>
            </table>
          </td></tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;padding:12px;margin-bottom:24px">
          <tr><td style="padding:12px">
            <p style="margin:0;font-size:12px;color:#888"><b>Request:</b> ${bloodGroup} for ${patientName}</p>
          </td></tr>
        </table>

        <table cellpadding="0" cellspacing="0"><tr>
          <td style="background:#15803d;border-radius:12px;padding:12px 28px">
            <a href="tel:${donorContact}" style="color:#fff;font-weight:700;font-size:14px;text-decoration:none">📞 Call Donor Now</a>
          </td>
        </tr></table>
    `);

    return sendMail(requesterEmail, `✅ Donor Found — ${donorName} accepted your ${bloodGroup} request`, html);
}

/**
 * New compatible donor available nearby → email the requester
 */
export async function emailNewDonorNearby(
    requesterEmail: string,
    requesterName: string,
    donorName: string,
    donorBloodGroup: string,
    distanceKm: number,
) {
    const html = wrap(`
        <h2 style="margin:0 0 8px;color:#1d4ed8;font-size:20px">📍 New Donor Available Nearby!</h2>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
          Hi <b>${requesterName}</b>, a compatible donor just came online near your location.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;margin-bottom:24px">
          <tr><td style="padding:16px">
            <table cellpadding="4" cellspacing="0">
              <tr><td style="color:#888;font-size:13px;padding-right:12px">Donor</td><td style="color:#1a1c1d;font-weight:700;font-size:14px">${donorName}</td></tr>
              <tr><td style="color:#888;font-size:13px;padding-right:12px">Blood Group</td><td><span style="background:#b71c1c;color:#fff;padding:2px 10px;border-radius:20px;font-weight:800;font-size:13px">${donorBloodGroup}</span></td></tr>
              <tr><td style="color:#888;font-size:13px;padding-right:12px">Distance</td><td style="color:#1a1c1d;font-weight:700;font-size:14px">${distanceKm.toFixed(1)} km away</td></tr>
            </table>
          </td></tr>
        </table>

        <p style="color:#888;font-size:13px;margin:0">Open the app to send them a message or ping.</p>
    `);

    return sendMail(requesterEmail, `📍 ${donorBloodGroup} donor nearby — ${donorName} is ${distanceKm.toFixed(1)}km away`, html);
}

/**
 * Request status changed → email the requester
 */
export async function emailRequestStatusUpdate(
    requesterEmail: string,
    requesterName: string,
    patientName: string,
    bloodGroup: string,
    newStatus: string,
    actorName?: string,
) {
    const statusConfig: Record<string, { emoji: string; color: string; heading: string; message: string }> = {
        accepted: {
            emoji: '✅',
            color: '#15803d',
            heading: 'Request Accepted!',
            message: actorName
                ? `${actorName} has accepted to donate for your request.`
                : 'A donor has accepted your request.',
        },
        fulfilled: {
            emoji: '🎉',
            color: '#7c3aed',
            heading: 'Request Fulfilled!',
            message: 'Your blood request has been successfully fulfilled. Thank you for using LifeLink.',
        },
        cancelled: {
            emoji: '❌',
            color: '#dc2626',
            heading: 'Request Cancelled',
            message: 'Your blood request has been cancelled.',
        },
    };

    const cfg = statusConfig[newStatus] ?? {
        emoji: '📝',
        color: '#666',
        heading: 'Request Updated',
        message: `Your request status changed to "${newStatus}".`,
    };

    const html = wrap(`
        <h2 style="margin:0 0 8px;color:${cfg.color};font-size:20px">${cfg.emoji} ${cfg.heading}</h2>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">
          Hi <b>${requesterName}</b>, ${cfg.message}
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;margin-bottom:20px">
          <tr><td style="padding:16px">
            <table cellpadding="4" cellspacing="0">
              <tr><td style="color:#888;font-size:13px;padding-right:12px">Patient</td><td style="color:#1a1c1d;font-weight:700;font-size:14px">${patientName}</td></tr>
              <tr><td style="color:#888;font-size:13px;padding-right:12px">Blood Group</td><td><span style="background:#b71c1c;color:#fff;padding:2px 10px;border-radius:20px;font-weight:800;font-size:13px">${bloodGroup}</span></td></tr>
              <tr><td style="color:#888;font-size:13px;padding-right:12px">Status</td><td style="color:${cfg.color};font-weight:800;font-size:14px;text-transform:uppercase">${newStatus}</td></tr>
            </table>
          </td></tr>
        </table>
    `);

    return sendMail(requesterEmail, `${cfg.emoji} ${cfg.heading} — ${bloodGroup} for ${patientName}`, html);
}
