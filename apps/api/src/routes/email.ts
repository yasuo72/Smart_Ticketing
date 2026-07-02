import { Router, type ErrorRequestHandler } from 'express';
import { z, ZodError } from 'zod';
import { Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { enrichTicketWithAi } from '../services/ai/ticketAi.js';
import {
  extractEmailAddress,
  retrieveReceivedEmail,
  stripHtml,
} from '../services/email/emailService.js';

export const emailRouter = Router();

const inboundWebhookSchema = z.object({
  type: z.string().optional(),
  data: z
    .object({
      id: z.string().optional(),
      from: z.string().optional(),
      subject: z.string().optional(),
      text: z.string().optional().nullable(),
      html: z.string().optional().nullable(),
    })
    .optional(),
  from: z.string().optional(),
  subject: z.string().optional(),
  text: z.string().optional().nullable(),
  html: z.string().optional().nullable(),
});

emailRouter.post('/inbound/resend', async (request, response, next) => {
  try {
    const payload = inboundWebhookSchema.parse(request.body);
    const inboundEmail = await resolveInboundEmail(payload);

    if (!inboundEmail) {
      response.status(202).json({ skipped: true, reason: 'No email body available.' });
      return;
    }

    const senderEmail = extractEmailAddress(inboundEmail.from);
    const customer = await prisma.user.upsert({
      where: {
        email: senderEmail,
      },
      update: {},
      create: {
        email: senderEmail,
        name: senderEmail.split('@')[0] ?? senderEmail,
        passwordHash: 'email-created-user-no-password',
        role: Role.CUSTOMER,
      },
    });
    let ticket = await prisma.ticket.create({
      data: {
        subject: inboundEmail.subject,
        description: inboundEmail.text,
        customerId: customer.id,
        replies: {
          create: {
            authorId: customer.id,
            body: inboundEmail.text,
          },
        },
        auditEvents: {
          create: {
            actorId: customer.id,
            action: 'ticket.created_from_email',
          },
        },
      },
      include: {
        customer: true,
        agent: true,
        replies: {
          where: {
            isInternal: false,
          },
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            author: true,
          },
        },
        auditEvents: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    const enrichedTicket = await enrichTicketWithAi(ticket.id, ticket.subject, ticket.description);

    if (enrichedTicket) {
      ticket = enrichedTicket;
    }

    response.status(201).json({
      ticketId: ticket.id,
      customerId: customer.id,
    });
  } catch (error) {
    next(error);
  }
});

async function resolveInboundEmail(payload: z.infer<typeof inboundWebhookSchema>) {
  const directFrom = payload.data?.from ?? payload.from;
  const directSubject = payload.data?.subject ?? payload.subject;
  const directText = payload.data?.text ?? payload.text;
  const directHtml = payload.data?.html ?? payload.html;

  if (directFrom && directSubject && (directText || directHtml)) {
    return {
      from: directFrom,
      subject: directSubject,
      text: directText ?? stripHtml(directHtml ?? ''),
      html: directHtml,
    };
  }

  const emailId = payload.data?.id;

  if (!emailId) {
    return null;
  }

  return retrieveReceivedEmail(emailId);
}

const emailErrorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Invalid email webhook payload.',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  response.status(500).json({ error: 'Email webhook failed.' });
};

emailRouter.use(emailErrorHandler);
