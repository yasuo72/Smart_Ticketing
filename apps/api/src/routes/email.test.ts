import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();
const testRunId = `phase8-${Date.now()}`;

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
      customerId: {
        in: userIds,
      },
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

describe('email integration', () => {
  it('creates a customer and ticket from an inbound email payload', async () => {
    const response = await request(app)
      .post('/api/email/inbound/resend')
      .send({
        type: 'email.received',
        data: {
          from: `${testRunId}-sender@test.local`,
          subject: 'Need help from email',
          text: 'I am sending this support request by email.',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.ticketId).toEqual(expect.any(String));

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: response.body.ticketId,
      },
      include: {
        customer: true,
        replies: true,
      },
    });

    expect(ticket).toMatchObject({
      subject: 'Need help from email',
      customer: {
        email: `${testRunId}-sender@test.local`,
      },
    });
    expect(ticket?.replies[0]?.body).toBe('I am sending this support request by email.');
  });

  it('returns accepted when Resend metadata has no retrievable body in local config', async () => {
    const response = await request(app)
      .post('/api/email/inbound/resend')
      .send({
        type: 'email.received',
        data: {
          id: 'received-email-id',
        },
      });

    expect(response.status).toBe(202);
    expect(response.body.skipped).toBe(true);
  });
});
