import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body ?? {};
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const { error } = await resend.emails.send({
      from: 'DAVRE Studios <onboarding@resend.dev>',
      to: email,
      subject: "You're on the DAVRE Tutorials waitlist 🎉",
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0a0a0b;">
          <h1 style="font-size: 28px; font-weight: 500; margin: 0 0 16px;">You're on the list!</h1>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 12px;">
            Thanks for joining the DAVRE STUDIOS Tutorials waitlist. You'll be the first to know
            the moment tutorials go live🚀.
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
            Keep an eye on your inbox — good things are coming <em>soon</em>.
          </p>
          <p style="font-size: 13px; color: #888; margin: 0;">— DAVRE Studios</p>
        </div>
      `,
    });

    if (error) {
      return res.status(502).json({ error: 'Could not send the confirmation email. Please try again.' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
