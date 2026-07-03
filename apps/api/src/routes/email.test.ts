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

  it('handles Sender / form-urlencoded webhook formats and creates tickets', async () => {
    const response = await request(app)
      .post('/api/email/inbound/sender')
      .type('form')
      .send({
        sender: `Sender User <${testRunId}-sender-form@test.local>`,
        subject: 'Mobile Gmail Issue',
        body: 'Here is a bug report sent from mobile email.',
      });

    expect(response.status).toBe(201);
    expect(response.body.action).toBe('created');

    const ticket = await prisma.ticket.findUnique({
      where: { id: response.body.ticketId },
      include: { customer: true },
    });
    expect(ticket?.customer.email).toBe(`${testRunId}-sender-form@test.local`);
  });

  it('appends a reply to an existing open ticket when customer replies via email', async () => {
    // Initial email creates ticket
    const initialRes = await request(app)
      .post('/api/email/inbound')
      .send({
        from: `${testRunId}-reply@test.local`,
        subject: 'Account Reset Request',
        text: 'Initial request to reset account.',
      });

    expect(initialRes.status).toBe(201);
    const ticketId = initialRes.body.ticketId;

    // Follow-up email from customer (e.g. mobile reply with Re: prefix)
    const replyRes = await request(app)
      .post('/api/email/inbound')
      .send({
        from: `${testRunId}-reply@test.local`,
        subject: 'Re: Account Reset Request',
        text: 'Adding more details from mobile app.',
      });

    expect(replyRes.status).toBe(200);
    expect(replyRes.body.action).toBe('replied');
    expect(replyRes.body.ticketId).toBe(ticketId);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { replies: true },
    });

    expect(ticket?.replies.length).toBeGreaterThanOrEqual(2);
    const customerReply = ticket?.replies.find(
      (r) => r.body === 'Adding more details from mobile app.',
    );
    expect(customerReply).toBeDefined();
  });

  it('handles Resend email_id payloads and creates a ticket even when body is omitted', async () => {
    const response = await request(app)
      .post('/api/email/inbound/resend')
      .send({
        created_at: '2026-07-02T20:44:11.000Z',
        data: {
          attachments: [],
          bcc: [],
          cc: [],
          created_at: '2026-07-02T20:44:25.225Z',
          email_id: '32b8b445-6584-4708-9d54-dc4b6fa69616',
          from: `${testRunId}-parul@test.local`,
          message_id: '<test-message-id@mail.gmail.com>',
          received_for: ['support@rohitis.online'],
          subject: 'Re: Hey',
          to: ['support@rohitis.online'],
        },
        type: 'email.received',
      });

    expect(response.status).toBe(201);
    expect(response.body.action).toBe('created');
    expect(response.body.ticketId).toEqual(expect.any(String));
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
