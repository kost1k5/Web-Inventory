const mailgun = require('mailgun.js');
const FormData = require('form-data');

const mg = new mailgun(FormData);

const domain = process.env.MAILGUN_DOMAIN;
const client = mg.client({ username: 'api', key: process.env.MAILGUN_API_KEY });

async function sendEmailToAdmins(admins, ticketData) {
  if (!process.env.MAILGUN_API_KEY || !domain) {
    console.error('[email] Missing MAILGUN_API_KEY or MAILGUN_DOMAIN');
    return { ok: false, reason: 'missing_mailgun_env' };
  }

  const adminEmails = admins.filter(Boolean);
  if (adminEmails.length === 0) {
    console.log('[email] No admins to notify');
    return { ok: false, reason: 'no_admin_recipients' };
  }

  const subject = `[Support] ${ticketData.ticketId} — ${ticketData.Priority} Priority`;
  const html = `
    <p><strong>New Support Ticket</strong></p>
    <p><strong>ID:</strong> ${ticketData.ticketId}</p>
    <p><strong>Summary:</strong> ${ticketData.Summary}</p>
    <p><strong>Priority:</strong> <strong style="color: ${ticketData.Priority === 'High' ? 'red' : ticketData.Priority === 'Average' ? 'orange' : 'green'}">${ticketData.Priority}</strong></p>
    <p><strong>Reported by:</strong> ${ticketData['Reported by'].name} (${ticketData['Reported by'].email})</p>
    <p><strong>Inventory:</strong> ${ticketData.Inventory || '—'}</p>
    <p><strong>Link:</strong> <a href="${ticketData.Link}">${ticketData.Link}</a></p>
    <p><strong>Submitted:</strong> ${new Date(ticketData.submittedAt).toLocaleString()}</p>
  `;

  try {
    const fromAddress = `Mailgun Sandbox <postmaster@${domain}>`;
    const response = await client.messages.create(domain, {
      from: fromAddress,
      to: adminEmails.join(','),
      subject,
      html,
    });
    console.log('[email] Sent successfully:', response.id);
    return { ok: true, id: response.id };
  } catch (e) {
    console.error('[email] Failed:', {
      message: e?.message,
      status: e?.status,
      details: e?.details,
    });
    return {
      ok: false,
      reason: 'mailgun_send_failed',
      error: e?.message,
      status: e?.status,
      details: e?.details,
    };
  }
}

module.exports = { sendEmailToAdmins };
