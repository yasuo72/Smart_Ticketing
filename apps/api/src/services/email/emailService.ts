import { Resend } from 'resend';

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type InboundEmail = {
  from: string;
  subject: string;
  text: string;
  html?: string | null;
};

export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (process.env.NODE_ENV === 'test' || !apiKey || apiKey.includes('replace-with') || !from) {
    console.info('Email send skipped because Resend is not configured.', {
      to: input.to,
      subject: input.subject,
    });
    return { skipped: true, id: null };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }

  return { skipped: false, id: data?.id ?? null };
}

export async function sendTicketReplyEmail({
  customerEmail,
  ticketSubject,
  replyBody,
}: {
  customerEmail: string;
  ticketSubject: string;
  replyBody: string;
}) {
  try {
    await sendEmail({
      to: customerEmail,
      subject: `Re: ${ticketSubject}`,
      text: `${replyBody}\n\nReply to this email or open your support ticket to continue the conversation.`,
      html: `<p>${escapeHtml(replyBody).replace(/\n/g, '<br>')}</p><p>Reply to this email or open your support ticket to continue the conversation.</p>`,
      replyTo: process.env.SUPPORT_EMAIL || 'support@rohitis.online',
    });
  } catch (error) {
    console.warn('Ticket reply email skipped:', error instanceof Error ? error.message : error);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function retrieveReceivedEmail(emailId: string): Promise<InboundEmail | null> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.includes('replace-with')) {
    return null;
  }

  try {
    let response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      response = await fetch(`https://api.resend.com/emails/${emailId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
    }

    if (!response.ok) {
      console.warn(`Received email retrieval status: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      from?: unknown;
      subject?: string;
      text?: string | null;
      html?: string | null;
    };

    const fromStr = extractEmailAddress(data.from);

    return {
      from: fromStr,
      subject: data.subject ?? 'Support Request',
      text: data.text ?? (data.html ? stripHtml(data.html) : ''),
      html: data.html,
    };
  } catch (err) {
    console.warn('Failed to retrieve email content from Resend:', err);
    return null;
  }
}

export function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractEmailAddress(value: unknown): string {
  if (!value) return '';

  if (typeof value === 'string') {
    const match = value.match(/<([^>]+)>/);
    return (match?.[1] ?? value).trim().toLowerCase();
  }

  if (Array.isArray(value) && value.length > 0) {
    return extractEmailAddress(value[0]);
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const raw = obj.email ?? obj.address ?? obj.value ?? obj.from;
    if (raw) {
      return extractEmailAddress(raw);
    }
  }

  return String(value).trim().toLowerCase();
}
