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

export async function retrieveReceivedEmail(emailId: string): Promise<InboundEmail | null> {
  const apiKey = process.env.RESEND_API_KEY;

  if (process.env.NODE_ENV === 'test' || !apiKey || apiKey.includes('replace-with')) {
    return null;
  }

  const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Received email retrieval failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    from?: string;
    subject?: string;
    text?: string | null;
    html?: string | null;
  };

  if (!data.from || !data.subject || (!data.text && !data.html)) {
    return null;
  }

  return {
    from: data.from,
    subject: data.subject,
    text: data.text ?? stripHtml(data.html ?? ''),
    html: data.html,
  };
}

export function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);

  return (match?.[1] ?? value).trim().toLowerCase();
}
