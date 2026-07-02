import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../services/auth.js';

const app = createApp();
const testRunId = `phase3-${Date.now()}`;

async function createUser({
  email,
  role = Role.CUSTOMER,
  isActive = true,
}: {
  email: string;
  role?: Role;
  isActive?: boolean;
}) {
  return prisma.user.create({
    data: {
      email,
      name: 'Test User',
      passwordHash: await hashPassword('Password123!'),
      role,
      isActive,
    },
  });
}

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: testRunId,
      },
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('auth flow', () => {
  it('rejects protected routes without a session', async () => {
    const response = await request(app).get('/api/protected');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Authentication required.');
  });

  it('signs up a customer and starts a session', async () => {
    const agent = request.agent(app);
    const email = `${testRunId}-signup@test.local`;

    const signupResponse = await agent.post('/api/auth/signup').send({
      name: 'New Customer',
      email,
      password: 'Password123!',
    });

    expect(signupResponse.status).toBe(201);
    expect(signupResponse.headers['set-cookie']).toBeDefined();
    expect(signupResponse.body.user).toMatchObject({
      email,
      name: 'New Customer',
      role: Role.CUSTOMER,
      isActive: true,
    });
    expect(signupResponse.body.user.passwordHash).toBeUndefined();

    const meResponse = await agent.get('/api/auth/me');

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe(email);
  });

  it('rejects duplicate signups', async () => {
    const email = `${testRunId}-duplicate@test.local`;

    await createUser({ email });

    const response = await request(app).post('/api/auth/signup').send({
      name: 'Duplicate Customer',
      email,
      password: 'Password123!',
    });

    expect(response.status).toBe(409);
  });

  it('logs in, accesses protected routes, and logs out', async () => {
    const agent = request.agent(app);
    const email = `${testRunId}-login@test.local`;

    await createUser({ email });

    const loginResponse = await agent.post('/api/auth/login').send({
      email,
      password: 'Password123!',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.email).toBe(email);

    const protectedResponse = await agent.get('/api/protected');

    expect(protectedResponse.status).toBe(200);
    expect(protectedResponse.body.user.email).toBe(email);

    const logoutResponse = await agent.post('/api/auth/logout');

    expect(logoutResponse.status).toBe(204);

    const afterLogoutResponse = await agent.get('/api/protected');

    expect(afterLogoutResponse.status).toBe(401);
  });

  it('rejects wrong-role requests with 403', async () => {
    const agent = request.agent(app);
    const email = `${testRunId}-customer-role@test.local`;

    await createUser({ email, role: Role.CUSTOMER });

    await agent.post('/api/auth/login').send({
      email,
      password: 'Password123!',
    });

    const response = await agent.get('/api/admin/ping');

    expect(response.status).toBe(403);
  });

  it('allows admin-only requests for admins', async () => {
    const agent = request.agent(app);
    const email = `${testRunId}-admin-role@test.local`;

    await createUser({ email, role: Role.ADMIN });

    await agent.post('/api/auth/login').send({
      email,
      password: 'Password123!',
    });

    const response = await agent.get('/api/admin/ping');

    expect(response.status).toBe(200);
  });

  it('rejects inactive users at login', async () => {
    const email = `${testRunId}-inactive@test.local`;

    await createUser({ email, isActive: false });

    const response = await request(app).post('/api/auth/login').send({
      email,
      password: 'Password123!',
    });

    expect(response.status).toBe(401);
  });
});
