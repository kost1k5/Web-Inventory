const RESEND_URL = 'https://api.resend.com/emails';

function isSupportEmailEnabled() {
  return String(process.env.SUPPORT_TICKET_EMAIL_ENABLED || 'false').toLowerCase() === 'true';
}

async function sendEmailToAdmins(admins, ticketData) {
  // For Power Automate Desktop flow we keep backend email disabled by default
  // to avoid duplicate notifications from both backend and PAD.
  if (!isSupportEmailEnabled()) {
    return {
      ok: false,
      skipped: true,
      reason: 'disabled_by_config',
      provider: 'none',
    };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[email] Missing RESEND_API_KEY');
    return { ok: false, reason: 'missing_resend_env' };
  }

  const fromAddress = process.env.RESEND_FROM || 'Web Inventory <onboarding@resend.dev>';
  const adminEmails = admins.filter(Boolean);
  if (adminEmails.length === 0) {
    console.log('[email] No admins to notify');
    return { ok: false, reason: 'no_admin_recipients' };
  }

  const subject = `[Support] ${ticketData.ticketId} - ${ticketData.Priority} Priority`;
  const html = `
    <p><strong>New Support Ticket</strong></p>
    <p><strong>ID:</strong> ${ticketData.ticketId}</p>
    <p><strong>Summary:</strong> ${ticketData.Summary}</p>
    <p><strong>Priority:</strong> <strong style="color: ${ticketData.Priority === 'High' ? 'red' : ticketData.Priority === 'Average' ? 'orange' : 'green'}">${ticketData.Priority}</strong></p>
    <p><strong>Reported by:</strong> ${ticketData['Reported by'].name} (${ticketData['Reported by'].email})</p>
    <p><strong>Inventory:</strong> ${ticketData.Inventory || '-'} </p>
    <p><strong>Link:</strong> <a href="${ticketData.Link}">${ticketData.Link}</a></p>
    <p><strong>Submitted:</strong> ${new Date(ticketData.submittedAt).toLocaleString()}</p>
  `;

  try {
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: adminEmails,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[email] Resend failed:', data);
      return {
        ok: false,
        reason: 'resend_send_failed',
        status: response.status,
        details: data,
      };
    }

    console.log('[email] Sent successfully via Resend:', data.id);
    return { ok: true, id: data.id, provider: 'resend' };
  } catch (e) {
    console.error('[email] Resend request error:', e.message);
    return {
      ok: false,
      reason: 'resend_request_error',
      error: e.message,
    };
  }
}

module.exports = { sendEmailToAdmins };
