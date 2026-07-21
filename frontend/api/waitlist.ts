import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  const { email } = req.body ?? {};
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    await transporter.sendMail({
      from: `DAVRE Studios <${GMAIL_USER}>`,
      to: email,
      subject: "Thanks For Joining The Waitlist 🎉",
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0a0a0b;">
          <h1 style="font-size: 28px; font-weight: 500; margin: 0 0 16px;">YOU'RE IN!</h1>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 12px;">
            Hey Fam, Congrats on joining the DAVRE STUDIOS Tutorials waitlist. You'll be the first to know
            the moment tutorials go live🚀.
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Keep an eye on your inbox — good things are coming <em>soon</em>.
          </p>
          <p style="font-size: 13px; color: #888; margin: 0;">— DAVRE Studios</p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Could not send the confirmation email. Please try again.' });
  }
}
