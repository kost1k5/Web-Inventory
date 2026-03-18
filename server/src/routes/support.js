const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const { sendEmailToAdmins } = require('../services/emailService');

const router = Router();

// Refresh token живёт бессрочно — каждый запрос получает свежий access token.
async function getDropboxAccessToken() {
  if (!process.env.DROPBOX_REFRESH_TOKEN || !process.env.DROPBOX_APP_KEY || !process.env.DROPBOX_APP_SECRET) {
    throw new Error('Missing Dropbox environment variables: DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, or DROPBOX_APP_SECRET');
  }
  
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
    const text = await resp.text();
    throw new Error(`Dropbox token refresh failed: ${text}`);
  }
  const data = await resp.json();
  return data.access_token;
}

router.post('/support-tickets', requireAuth, async (req, res) => {
  try {
    const { summary, priority, link, inventoryId } = req.body || {};

    const allowed = ['High', 'Average', 'Low'];
    if (!summary || !String(summary).trim()) {
      return res.status(400).json({ error: 'Summary is required' });
    }
    if (!allowed.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    if (!link || !String(link).trim()) {
      return res.status(400).json({ error: 'Link is required' });
    }

    let inventoryTitle = null;
    if (inventoryId) {
      const inv = await Inventory.findByPk(inventoryId, { attributes: ['id', 'title'] });
      inventoryTitle = inv?.title || null;
    }

    const admins = await User.findAll({
      where: { isAdmin: true, isBlocked: false },
      attributes: ['email'],
    });
    const adminEmails = [...new Set(admins.map((a) => a.email).filter(Boolean))];

    const now = new Date().toISOString();
    const ticketId = `SUP-${Date.now()}`;

    const payload = {
      ticketId,
      Summary: String(summary).trim(),
      Priority: priority,
      "Reported by": {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      Inventory: inventoryTitle,
      Link: String(link).trim(),
      "Admins' emails": adminEmails,
      submittedAt: now,
      source: 'web-inventory',
    };

    const dropboxToken = await getDropboxAccessToken();

    const dropboxPath = `/SupportTickets/${ticketId}.json`;
    const content = JSON.stringify(payload, null, 2);

    const uploadResp = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${dropboxToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'add',
          autorename: true,
          mute: false,
          strict_conflict: false,
        }),
      },
      body: Buffer.from(content, 'utf-8'),
    });

    if (!uploadResp.ok) {
      const errText = await uploadResp.text();
      return res.status(502).json({ error: 'Dropbox upload failed', details: errText });
    }

    const emailResult = await sendEmailToAdmins(adminEmails, payload);

    return res.status(201).json({
      ticketId,
      dropboxPath,
      uploadedAt: now,
      email: emailResult,
    });
  } catch (e) {
    console.error('[support] Failed to create ticket:', e);
    return res.status(500).json({ error: 'Failed to create support ticket', details: e.message });
  }
});

module.exports = router;