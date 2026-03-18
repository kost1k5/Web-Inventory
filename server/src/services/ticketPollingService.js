const cron = require('node-cron');
const { sendEmailToAdmins } = require('./emailService');
const User = require('../models/User');

let lastProcessedTickets = new Set();

async function getDropboxAccessToken() {
  const resp = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.DROPBOX_REFRESH_TOKEN,
      client_id: process.env.DROPBOX_APP_KEY,
      client_secret: process.env.DROPBOX_APP_SECRET,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Failed to get Dropbox token: ${resp.statusText}`);
  }

  const data = await resp.json();
  return data.access_token;
}

async function checkNewTickets() {
  try {
    console.log('[polling] Checking for new tickets...');
    
    const token = await getDropboxAccessToken();

    // Получаем список файлов в /SupportTickets
    const resp = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: '/SupportTickets' }),
    });

    if (!resp.ok) {
      console.error('[polling] Dropbox list failed:', resp.statusText);
      return;
    }

    const data = await resp.json();
    if (!data.entries || data.entries.length === 0) {
      console.log('[polling] No tickets found');
      return;
    }

    const admins = await User.findAll({
      where: { isAdmin: true, isBlocked: false },
      attributes: ['email'],
    });
    const adminEmails = [...new Set(admins.map((a) => a.email).filter(Boolean))];

    if (adminEmails.length === 0) {
      console.log('[polling] No active admins to notify');
      return;
    }

    // Обрабатываем только новые файлы
    for (const entry of data.entries) {
      if (entry.name.endsWith('.json') && !lastProcessedTickets.has(entry.id)) {
        lastProcessedTickets.add(entry.id);

        console.log('[polling] Processing new file:', entry.name);

        try {
          // Загружаем и парсим JSON
          const fileResp = await fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Dropbox-API-Arg': JSON.stringify({ path: entry.path_display }),
            },
          });

          if (!fileResp.ok) {
            console.error('[polling] Failed to download file:', entry.name);
            continue;
          }

          const text = await fileResp.text();
          const ticketData = JSON.parse(text);

          console.log('[polling] Found new ticket:', ticketData.ticketId);
          await sendEmailToAdmins(adminEmails, ticketData);
        } catch (e) {
          console.error('[polling] Error processing ticket:', e.message);
        }
      }
    }
  } catch (e) {
    console.error('[polling] Error:', e.message);
  }
}

// Запускаем проверку каждые 2 минуты в production
function startPolling() {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.log('[polling] Skipped: MAILGUN_API_KEY or MAILGUN_DOMAIN not set');
    return;
  }

  cron.schedule('*/2 * * * *', checkNewTickets);
  console.log('[polling] Service started — checking every 2 minutes');
}

module.exports = { startPolling };
