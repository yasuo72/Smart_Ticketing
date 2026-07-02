import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient, Priority, Role, TicketStatus } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  await prisma.auditEvent.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@aiticketing.local',
      name: 'Asha Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const agent = await prisma.user.create({
    data: {
      email: 'agent@aiticketing.local',
      name: 'Arjun Agent',
      passwordHash,
      role: Role.AGENT,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@aiticketing.local',
      name: 'Riya Customer',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const tickets = [
    {
      subject: 'Cannot reset my password',
      description:
        'I requested a password reset email twice but nothing has arrived in my inbox or spam folder.',
      status: TicketStatus.OPEN,
      priority: Priority.HIGH,
      category: 'Account',
      aiSummary: 'Customer cannot receive password reset emails after multiple attempts.',
      aiSuggestedPriority: Priority.HIGH,
      agentId: agent.id,
    },
    {
      subject: 'Duplicate charge on invoice',
      description:
        'My card was charged twice for the same monthly subscription. Please refund the extra payment.',
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.URGENT,
      category: 'Billing',
      aiSummary: 'Customer reports duplicate billing and requests a refund.',
      aiSuggestedPriority: Priority.URGENT,
      agentId: agent.id,
    },
    {
      subject: 'How do I change my account email?',
      description: 'I need to update the email address associated with my account.',
      status: TicketStatus.OPEN,
      priority: Priority.MEDIUM,
      category: 'Account',
      aiSummary: 'Customer wants instructions for changing their account email address.',
      aiSuggestedPriority: Priority.MEDIUM,
      agentId: null,
    },
    {
      subject: 'Business hours question',
      description: 'What are your support hours on weekends?',
      status: TicketStatus.AUTO_RESOLVED,
      priority: Priority.LOW,
      category: 'General',
      aiSummary: 'Customer asks for weekend support hours.',
      aiSuggestedPriority: Priority.LOW,
      agentId: null,
    },
    {
      subject: 'Dashboard loads slowly',
      description:
        'The analytics dashboard takes more than 20 seconds to load after I sign in each morning.',
      status: TicketStatus.OPEN,
      priority: Priority.HIGH,
      category: 'Technical',
      aiSummary: 'Customer reports slow dashboard loading after sign-in.',
      aiSuggestedPriority: Priority.HIGH,
      agentId: agent.id,
    },
  ];

  for (const ticket of tickets) {
    const createdTicket = await prisma.ticket.create({
      data: {
        ...ticket,
        customerId: customer.id,
        replies: {
          create: [
            {
              authorId: customer.id,
              body: ticket.description,
            },
          ],
        },
      },
    });

    await prisma.auditEvent.create({
      data: {
        ticketId: createdTicket.id,
        actorId: ticket.agentId ?? admin.id,
        action: 'ticket.seeded',
        toValue: ticket.status,
      },
    });
  }

  console.log('Seeded users and tickets:');
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Agent: ${agent.email}`);
  console.log(`- Customer: ${customer.email}`);
  console.log(`- Tickets: ${tickets.length}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
