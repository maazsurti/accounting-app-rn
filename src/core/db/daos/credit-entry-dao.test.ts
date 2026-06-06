import type { AppDatabase } from '../client';
import { createTestDb } from '../test-utils/test-db';
import { CreditEntryDao } from './credit-entry-dao';
import { CustomerDao } from './customer-dao';

function seedCustomer(db: AppDatabase, name: string): number {
  return new CustomerDao(db).insert({ name, createdAt: new Date('2026-01-01T00:00:00.000Z') });
}

describe('CreditEntryDao', () => {
  let db: AppDatabase;
  let dao: CreditEntryDao;
  let customerId: number;

  beforeEach(() => {
    db = createTestDb();
    dao = new CreditEntryDao(db);
    customerId = seedCustomer(db, 'Rakesh');
  });

  it('inserts a credit entry and returns its id', () => {
    const id = dao.insert({
      customerId,
      amount: 500,
      type: 'credit',
      date: new Date('2026-01-05T00:00:00.000Z'),
      createdAt: new Date('2026-01-05T00:00:00.000Z')
    });

    expect(id).toBeGreaterThan(0);
    expect(dao.getAll().map((e) => e.id)).toEqual([id]);
  });

  it('returns one customer’s entries newest-by-date first, excluding others', () => {
    const older = dao.insert({
      customerId,
      amount: 500,
      type: 'credit',
      date: new Date('2026-01-05T00:00:00.000Z'),
      createdAt: new Date('2026-01-05T00:00:00.000Z')
    });
    const newer = dao.insert({
      customerId,
      amount: 200,
      type: 'payment',
      date: new Date('2026-01-06T00:00:00.000Z'),
      createdAt: new Date('2026-01-06T00:00:00.000Z')
    });
    const otherCustomer = seedCustomer(db, 'Suresh');
    dao.insert({
      customerId: otherCustomer,
      amount: 100,
      type: 'credit',
      date: new Date('2026-01-07T00:00:00.000Z'),
      createdAt: new Date('2026-01-07T00:00:00.000Z')
    });

    expect(dao.getForCustomer(customerId).map((e) => e.id)).toEqual([newer, older]);
  });

  it('returns every entry across customers, newest-by-date first', () => {
    const a = dao.insert({
      customerId,
      amount: 500,
      type: 'credit',
      date: new Date('2026-01-05T00:00:00.000Z'),
      createdAt: new Date('2026-01-05T00:00:00.000Z')
    });
    const otherCustomer = seedCustomer(db, 'Suresh');
    const b = dao.insert({
      customerId: otherCustomer,
      amount: 100,
      type: 'credit',
      date: new Date('2026-01-06T00:00:00.000Z'),
      createdAt: new Date('2026-01-06T00:00:00.000Z')
    });

    expect(dao.getAll().map((e) => e.id)).toEqual([b, a]);
  });
});
