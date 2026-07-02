import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { Priority, Role, TicketStatus } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../services/auth.js';

const app = createApp();
const testRunId = `phase7-${Date.now()}`;

async function createUser({ email, role = Role.CUSTOMER }: { email: string; role?: Role }) {
  return prisma.user.create({
    data: {
      email,
      name: 'Dashboard Test User',
      passwordHash: await hashPassword('Password123!'),
      role,
    },
  });
}

async function login(email: string) {
  const agent = request.agent(app);

  await agent.post('/api/auth/login').send({
    email,
    password: 'Password123!',
  });

  return agent;
}

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  const users = await prisma.user.findMany({
    where: {
      email: {
        startsWith: testRunId,
      },
    },
    select: {
      id: true,
    },
  });
  const userIds = users.map((user) => user.id);

  await prisma.ticket.deleteMany({
    where: {
      OR: [{ customerId: { in: userIds } }, { agentId: { in: userIds } }],
    },
  });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('dashboard', () => {
  it('requires authentication', async () => {
    const response = await request(app).get('/api/dashboard');

    expect(response.status).toBe(401);
  });

  it('rejects customers', async () => {
    const customer = await createUser({ email: `${testRunId}-customer@test.local` });
    const agent = await login(customer.email);

    const response = await agent.get('/api/dashboard');

    expect(response.status).toBe(403);
  });

  it('returns ticket metrics and recent activity for agents', async () => {
    const customer = await createUser({ email: `${testRunId}-metrics-customer@test.local` });
    const agentUser = await createUser({
      email: `${testRunId}-metrics-agent@test.local`,
      role: Role.AGENT,
    });
    const createdAt = new Date(Date.now() - 60 * 60 * 1000);
    const resolvedAt = new Date();
    const resolvedTicket = await prisma.ticket.create({
      data: {
        subject: 'Resolved billing issue',
        description: 'A billing issue that has been resolved.',
        customerId: customer.id,
        agentId: agentUser.id,
        status: TicketStatus.RESOLVED,
        priority: Priority.HIGH,
        category: 'Billing',
        createdAt,
        resolvedAt,
        auditEvents: {
          create: {
            actorId: agentUser.id,
            action: 'ticket.status_changed',
            fromValue: TicketStatus.IN_PROGRESS,
            toValue: TicketStatus.RESOLVED,
          },
        },
      },
    });
    await prisma.ticket.create({
      data: {
        subject: 'Open account issue',
        description: 'An account issue that is still open.',
        customerId: customer.id,
        status: TicketStatus.OPEN,
        priority: Priority.LOW,
        category: 'Account',
      },
    });
    const agent = await login(agentUser.email);

    const response = await agent.get('/api/dashboard');

    expect(response.status).toBe(200);
    expect(response.body.counts.byStatus.RESOLVED).toBeGreaterThanOrEqual(1);
    expect(response.body.counts.byPriority.HIGH).toBeGreaterThanOrEqual(1);
    expect(response.body.counts.byCategory.Billing).toBeGreaterThanOrEqual(1);
    expect(response.body.averageResolutionMs).toBeGreaterThan(0);
    expect(response.body.recentActivity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'ticket.status_changed',
          ticket: expect.objectContaining({
            id: resolvedTicket.id,
          }),
        }),
      ]),
    );
  });
});
