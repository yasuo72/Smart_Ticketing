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
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
  await page.getByLabel('Full Name').fill('E2E Customer');
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByText('E2E Customer')).toBeVisible();
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByTestId('create-ticket-form').getByPlaceholder('Subject').fill(subject);
  await page
    .getByTestId('create-ticket-form')
    .getByPlaceholder('Describe your issue...')
    .fill('The customer portal will not load after sign in.');
  await page
    .getByTestId('create-ticket-form')
    .getByRole('button', { name: 'Submit Ticket' })
    .click();

  await expect(page.getByTestId('ticket-list').getByText(subject).first()).toBeVisible();
  await expect(page.getByTestId('ticket-detail').getByText(subject).first()).toBeVisible();
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
  await page.getByLabel('Email Address').fill(agentEmail);
  await page.getByLabel('Password').fill('Password123!');
  await page.getByTestId('auth-form').getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('E2E Agent')).toBeVisible();
  await page.getByRole('button', { name: 'Tickets', exact: true }).click();
  await page.getByTestId('ticket-list').getByText(subject).click();
  await page.getByRole('button', { name: 'Assign to me' }).click();
  await expect(page.getByTestId('ticket-detail').getByText('E2E Agent')).toBeVisible();

  await page
    .getByTestId('reply-form')
    .getByPlaceholder('Write your reply...')
    .fill('we are checking this soon');
  await page.getByRole('button', { name: 'Polish with AI' }).click();
  await expect(page.getByText('AI Polished Reply')).toBeVisible();
  await page.getByRole('button', { name: 'Use this →' }).click();
  await page.getByRole('button', { name: 'Send Reply' }).click();

  await expect(
    page.getByTestId('ticket-detail').getByText('Thanks for reaching out'),
  ).toBeVisible();
  await page.getByTestId('ticket-detail').locator('select').first().selectOption('RESOLVED');
  await expect(page.getByTestId('ticket-detail').locator('select').first()).toHaveValue('RESOLVED');
});

test('admin sees dashboard metrics and user management', async ({ page }) => {
  const adminEmail = `${testRunId}-admin@test.local`;

  await createUser(adminEmail, 'E2E Admin', 'ADMIN');

  await page.goto('/');
  await page.getByLabel('Email Address').fill(adminEmail);
  await page.getByLabel('Password').fill('Password123!');
  await page.getByTestId('auth-form').getByRole('button', { name: 'Sign In' }).click();

  await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible();
  await page.getByRole('button', { name: 'Users' }).click();
  await expect(page.locator('h1').filter({ hasText: 'Users' })).toBeVisible();
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
