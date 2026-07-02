import { expect, test } from '@playwright/test';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: 'apps/api/.env' });

const testRunId = `e2e-${Date.now()}`;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Playwright setup.');
}

const client = new pg.Client({ connectionString: databaseUrl });

test.beforeAll(async () => {
  await client.connect();
});

test.afterAll(async () => {
  const users = await client.query<{ id: string }>('select id from "User" where email like $1', [
    `${testRunId}%`,
  ]);
  const userIds = users.rows.map((user) => user.id);

  if (userIds.length > 0) {
    await client.query('delete from "Ticket" where "customerId" = any($1) or "agentId" = any($1)', [
      userIds,
    ]);
    await client.query('delete from "User" where id = any($1)', [userIds]);
  }

  await client.end();
});

test('customer can sign up, create a ticket, and see it in their queue', async ({ page }) => {
  const email = `${testRunId}-customer@test.local`;
  const subject = `${testRunId} customer ticket`;

  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await page.getByLabel('Name').fill('E2E Customer');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText(email)).toBeVisible();
  await page.getByTestId('create-ticket-form').getByLabel('Subject').fill(subject);
  await page
    .getByTestId('create-ticket-form')
    .getByLabel('Description')
    .fill('The customer portal will not load after sign in.');
  await page
    .getByTestId('create-ticket-form')
    .getByRole('button', { name: 'Create ticket' })
    .click();

  await expect(page.getByTestId('ticket-list').getByText(subject)).toBeVisible();
  await expect(page.getByTestId('ticket-detail').getByText(subject)).toBeVisible();
});

test('agent can assign, polish, reply, and resolve a customer ticket', async ({ page }) => {
  const customerEmail = `${testRunId}-reply-customer@test.local`;
  const agentEmail = `${testRunId}-agent@test.local`;
  const subject = `${testRunId} needs agent reply`;

  const customerId = await createUser(customerEmail, 'E2E Reply Customer', 'CUSTOMER');
  await createUser(agentEmail, 'E2E Agent', 'AGENT');
  await client.query(
    'insert into "Ticket" (id, subject, description, status, priority, "customerId", "createdAt", "updatedAt") values ($1, $2, $3, $4, $5, $6, now(), now())',
    [
      `${testRunId}-ticket`,
      subject,
      'A customer needs a human reply for this issue.',
      'OPEN',
      'MEDIUM',
      customerId,
    ],
  );

  await page.goto('/');
  await page.getByLabel('Email').fill(agentEmail);
  await page.getByLabel('Password').fill('Password123!');
  await page.getByTestId('auth-form').getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText(agentEmail)).toBeVisible();
  await page.getByTestId('ticket-list').getByText(subject).click();
  await page.getByRole('button', { name: 'Assign to me' }).click();
  await expect(page.getByTestId('ticket-detail').getByText('E2E Agent')).toBeVisible();

  await page.getByTestId('reply-form').getByLabel('Reply').fill('we are checking this soon');
  await page.getByRole('button', { name: 'Polish' }).click();
  await expect(page.getByText('Polished reply')).toBeVisible();
  await page.getByRole('button', { name: 'Use polished' }).click();
  await page.getByRole('button', { name: 'Send reply' }).click();

  await expect(
    page.getByTestId('ticket-detail').getByText('Thanks for reaching out'),
  ).toBeVisible();
  await page.getByTestId('ticket-detail').getByLabel('Status').selectOption('RESOLVED');
  await expect(page.getByTestId('ticket-detail').getByLabel('Status')).toHaveValue('RESOLVED');
});

test('admin sees dashboard metrics and user management', async ({ page }) => {
  const adminEmail = `${testRunId}-admin@test.local`;

  await createUser(adminEmail, 'E2E Admin', 'ADMIN');

  await page.goto('/');
  await page.getByLabel('Email').fill(adminEmail);
  await page.getByLabel('Password').fill('Password123!');
  await page.getByTestId('auth-form').getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible();
});

async function createUser(email: string, name: string, role: 'CUSTOMER' | 'AGENT' | 'ADMIN') {
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const id = `${testRunId}-${role.toLowerCase()}-${Math.random().toString(36).slice(2)}`;

  await client.query(
    'insert into "User" (id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt") values ($1, $2, $3, $4, $5, true, now(), now())',
    [id, email, name, passwordHash, role],
  );

  return id;
}
