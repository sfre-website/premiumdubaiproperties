const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('Missing GMAIL_USER or GMAIL_PASS environment variables');
    return res.status(500).json({ error: 'Mail service not configured.' });
  }

  const { name, email, phone, propertyType, budget, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from:    `"Dubai Premium Edge" <${process.env.GMAIL_USER}>`,
      to:      'nihaal@springfield-re.com',
      replyTo: email,
      subject: `New Property Enquiry — ${esc(name)}`,
      html:    buildEmail({ name, email, phone, propertyType, budget, message }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mail send failed:', err.message, err.code);
    return res.status(500).json({ error: 'Failed to send enquiry. Please try again.' });
  }
};

function buildEmail({ name, email, phone, propertyType, budget, message }) {
  const rows = [
    ['Name',          esc(name)],
    ['Email',         `<a href="mailto:${esc(email)}" style="color:#0d6efd;text-decoration:none">${esc(email)}</a>`],
    phone        ? ['Phone',         esc(phone)]        : null,
    propertyType ? ['Property Type', esc(propertyType)] : null,
    budget       ? ['Budget Range',  esc(budget)]       : null,
  ]
    .filter(Boolean)
    .map(([label, value]) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #e9ecef;width:130px;
                   font-size:11px;font-weight:600;letter-spacing:0.08em;
                   text-transform:uppercase;color:#6c757d;vertical-align:top">
          ${label}
        </td>
        <td style="padding:14px 0 14px 20px;border-bottom:1px solid #e9ecef;
                   font-size:15px;color:#212529;vertical-align:top">
          ${value}
        </td>
      </tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 20px">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 4px 16px rgba(33,37,41,0.10)">
        <tr>
          <td style="background:#212529;padding:32px 40px;border-bottom:4px solid #0d6efd">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.15em;
                      text-transform:uppercase;color:#0d6efd">New Enquiry</p>
            <h1 style="margin:0;font-size:22px;font-weight:300;color:#ffffff;letter-spacing:0.02em">
              Dubai Premium Edge
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
            <p style="margin:24px 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;
                      text-transform:uppercase;color:#6c757d">Message</p>
            <div style="background:#f8f9fa;padding:20px;border-radius:4px;
                        font-size:15px;color:#212529;line-height:1.65">
              ${esc(message).replace(/\n/g, '<br>')}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 24px;border-top:1px solid #e9ecef;font-size:12px;color:#adb5bd">
            Sent via dubaipremiumedge.com &mdash;
            Reply directly to this email to respond to ${esc(name)}.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
