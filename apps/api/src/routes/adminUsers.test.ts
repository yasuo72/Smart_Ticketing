import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../services/auth.js';

const app = createApp();
const testRunId = `phase4-${Date.now()}`;

async function createUser({
  email,
  name = 'Test User',
  role = Role.CUSTOMER,
  isActive = true,
}: {
  email: string;
  name?: string;
  role?: Role;
  isActive?: boolean;
}) {
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword('Password123!'),
      role,
      isActive,
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

describe('admin user management', () => {
  it('rejects unauthenticated user listing', async () => {
    const response = await request(app).get('/api/admin/users');

    expect(response.status).toBe(401);
  });

  it('rejects non-admin user listing', async () => {
    const customer = await createUser({
      email: `${testRunId}-customer@test.local`,
      role: Role.CUSTOMER,
    });
    const agent = await login(customer.email);

    const response = await agent.get('/api/admin/users');

    expect(response.status).toBe(403);
  });

  it('lists users with role and search filters', async () => {
    const admin = await createUser({
      email: `${testRunId}-admin@test.local`,
      role: Role.ADMIN,
    });
    await createUser({
      email: `${testRunId}-agent@test.local`,
      name: 'Filtered Agent',
      role: Role.AGENT,
    });
    await createUser({
      email: `${testRunId}-other@test.local`,
      name: 'Different Person',
      role: Role.CUSTOMER,
    });
    const agent = await login(admin.email);

    const response = await agent.get('/api/admin/users').query({
      role: Role.AGENT,
      search: 'Filtered',
    });

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0]).toMatchObject({
      email: `${testRunId}-agent@test.local`,
      role: Role.AGENT,
    });
    expect(response.body.users[0].passwordHash).toBeUndefined();
  });

  it('views and updates a user', async () => {
    const admin = await createUser({
      email: `${testRunId}-admin-view@test.local`,
      role: Role.ADMIN,
    });
    const target = await createUser({
      email: `${testRunId}-target@test.local`,
      role: Role.CUSTOMER,
    });
    const agent = await login(admin.email);

    const viewResponse = await agent.get(`/api/admin/users/${target.id}`);

    expect(viewResponse.status).toBe(200);
    expect(viewResponse.body.user.email).toBe(target.email);

    const updateResponse = await agent.patch(`/api/admin/users/${target.id}`).send({
      name: 'Promoted Agent',
      role: Role.AGENT,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.user).toMatchObject({
      name: 'Promoted Agent',
      role: Role.AGENT,
    });
  });

  it('deactivates a user through delete', async () => {
    const admin = await createUser({
      email: `${testRunId}-admin-delete@test.local`,
      role: Role.ADMIN,
    });
    const target = await createUser({
      email: `${testRunId}-delete-target@test.local`,
      role: Role.CUSTOMER,
    });
    const agent = await login(admin.email);

    const response = await agent.delete(`/api/admin/users/${target.id}`);

    expect(response.status).toBe(200);
    expect(response.body.user.isActive).toBe(false);
  });

  it('prevents an admin from deactivating their own account', async () => {
    const admin = await createUser({
      email: `${testRunId}-self-delete@test.local`,
      role: Role.ADMIN,
    });
    const agent = await login(admin.email);

    const response = await agent.delete(`/api/admin/users/${admin.id}`);

    expect(response.status).toBe(400);
  });
});
