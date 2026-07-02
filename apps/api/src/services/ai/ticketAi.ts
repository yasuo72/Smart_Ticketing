import { Priority, Role, TicketStatus } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { sendTicketReplyEmail } from '../email/emailService.js';
import { getAiProvider } from './provider.js';

type ClassificationResult = {
  category: string;
  priority: Priority;
  autoResolvable: boolean;
  autoReply: string | null;
};

const allowedCategories = new Set(['Billing', 'Technical', 'Account', 'General', 'Other']);
const allowedPriorities = new Set(Object.values(Priority));

export type AnalysisResult = {
  summary: string;
  category: string;
  priority: Priority;
  autoResolvable: boolean;
  autoReply: string | null;
};

function fallbackTicketAnalysis(subject: string, description: string): AnalysisResult {
  const combined = `${subject} ${description}`.toLowerCase();

  let category = 'General';
  let priority: Priority = Priority.MEDIUM;
  let autoResolvable = false;
  let autoReply: string | null = null;

  if (
    combined.includes('password') ||
    combined.includes('reset') ||
    combined.includes('login') ||
    combined.includes('sign in') ||
    combined.includes('forgot')
  ) {
    category = 'Account';
    if (combined.includes('password') || combined.includes('reset') || combined.includes('forgot')) {
      priority = Priority.LOW;
      autoResolvable = true;
      autoReply =
        'You can reset your password from the sign-in page by selecting "Forgot Password" and following the instructions sent to your email.';
    }
  } else if (
    combined.includes('bill') ||
    combined.includes('invoice') ||
    combined.includes('payment') ||
    combined.includes('charge') ||
    combined.includes('refund')
  ) {
    category = 'Billing';
    priority = Priority.HIGH;
  } else if (
    combined.includes('bug') ||
    combined.includes('error') ||
    combined.includes('broken') ||
    combined.includes('crash') ||
    combined.includes('failed') ||
    combined.includes('issue')
  ) {
    category = 'Technical';
    priority = Priority.HIGH;
  } else if (
    combined.includes('urgent') ||
    combined.includes('down') ||
    combined.includes('emergency') ||
    combined.includes('outage')
  ) {
    priority = Priority.URGENT;
  }

  const summary = `Support request regarding ${subject.trim() || 'account or technical help'}.`;

  return {
    summary,
    category,
    priority,
    autoResolvable,
    autoReply,
  };
}

export async function analyzeTicketWithAi(
  subject: string,
  description: string,
): Promise<AnalysisResult> {
  try {
    const prompt = `ANALYZE_TICKET
Analyze this customer support ticket.

Return only valid JSON with this shape:
{
  "summary": "1-2 sentence concise summary of the issue for an agent queue",
  "category": "Billing" | "Technical" | "Account" | "General" | "Other",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "autoResolvable": boolean,
  "autoReply": string | null
}

Only set autoResolvable true for simple, low-risk requests like password reset instructions, simple login help, or business hours. Do not auto-resolve billing disputes, security issues, outages, refunds, account deletion, or anything ambiguous.

Subject: ${subject}
Description: ${description}`;

    const text = await getAiProvider().generateText(prompt, {
      temperature: 0.1,
      responseMimeType: 'application/json',
    });
    const parsed = parseJsonObject(text);

    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : `Ticket regarding ${subject}`;
    const category = typeof parsed.category === 'string' ? parsed.category : 'Other';
    const priority = typeof parsed.priority === 'string' ? parsed.priority : Priority.MEDIUM;
    const autoReply = typeof parsed.autoReply === 'string' ? parsed.autoReply.trim() : null;

    return {
      summary,
      category: allowedCategories.has(category) ? category : 'Other',
      priority: allowedPriorities.has(priority as Priority)
        ? (priority as Priority)
        : Priority.MEDIUM,
      autoResolvable: parsed.autoResolvable === true && Boolean(autoReply),
      autoReply,
    };
  } catch (error) {
    console.warn('AI API quota limit hit or failed, using Smart Fallback engine:', error instanceof Error ? error.message : error);
    return fallbackTicketAnalysis(subject, description);
  }
}

export async function summarizeTicket(subject: string, description: string) {
  const analysis = await analyzeTicketWithAi(subject, description);
  return analysis.summary;
}

export async function classifyTicket(
  subject: string,
  description: string,
): Promise<ClassificationResult> {
  const analysis = await analyzeTicketWithAi(subject, description);
  return {
    category: analysis.category,
    priority: analysis.priority,
    autoResolvable: analysis.autoResolvable,
    autoReply: analysis.autoReply,
  };
}

export async function polishReply(draft: string) {
  const prompt = `POLISH_REPLY
Rewrite this support-agent reply to be clearer, warmer, and more professional.
Keep the meaning the same. Do not add promises, discounts, policies, or facts that are not present.

Draft:
${draft}`;

  return getAiProvider().generateText(prompt, {
    temperature: 0.3,
  });
}

export async function enrichTicketWithAi(ticketId: string, subject: string, description: string) {
  try {
    const analysis = await analyzeTicketWithAi(subject, description);
    const aiUser =
      analysis.autoResolvable && analysis.autoReply
        ? await ensureAiAssistantUser()
        : null;

    const replyBody = analysis.autoReply
      ? `${analysis.autoReply}\n\nThis response was generated by AI. Reply here if you still need help.`
      : null;

    let customerEmailToNotify: string | null = null;

    await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: {
          id: ticketId,
        },
        data: {
          aiSummary: analysis.summary,
          category: analysis.category,
          aiSuggestedPriority: analysis.priority,
          status: aiUser ? TicketStatus.AUTO_RESOLVED : undefined,
          resolvedAt: aiUser ? new Date() : undefined,
        },
        include: {
          customer: true,
        },
      });

      customerEmailToNotify = updated.customer.email;

      if (aiUser && replyBody) {
        await tx.reply.create({
          data: {
            ticketId,
            authorId: aiUser.id,
            body: replyBody,
          },
        });
        await tx.auditEvent.create({
          data: {
            ticketId,
            actorId: aiUser.id,
            action: 'ticket.auto_resolved',
            fromValue: TicketStatus.OPEN,
            toValue: TicketStatus.AUTO_RESOLVED,
          },
        });
      }
    });

    if (aiUser && replyBody && customerEmailToNotify) {
      void sendTicketReplyEmail({
        customerEmail: customerEmailToNotify,
        ticketSubject: subject,
        replyBody,
      });
    }

    return loadTicketWithRelations(ticketId);
  } catch (error) {
    console.warn('AI enrichment skipped:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function ensureAiAssistantUser() {
  const email = 'ai-assistant@aiticketing.local';
  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      email,
      name: 'AI Support Assistant',
      passwordHash: 'system-user-no-login',
      role: Role.AGENT,
      isActive: false,
    },
  });
}

async function loadTicketWithRelations(ticketId: string) {
  return prisma.ticket.findUnique({
    where: {
      id: ticketId,
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
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : (trimmed.match(/```json\s*([\s\S]*?)```/)?.[1] ?? trimmed.match(/\{[\s\S]*\}/)?.[0]);

  if (!jsonText) {
    return {};
  }

  try {
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return {};
  }
}
