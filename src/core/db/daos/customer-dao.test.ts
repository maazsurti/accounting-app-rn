import type { AppDatabase } from '../client';
import { createTestDb } from '../test-utils/test-db';
import { CustomerDao } from './customer-dao';

describe('CustomerDao', () => {
  let db: AppDatabase;
  let dao: CustomerDao;

  beforeEach(() => {
    db = createTestDb();
    dao = new CustomerDao(db);
  });

  it('inserts a customer and returns its id', () => {
    const id = dao.insert({
      name: 'Rakesh',
      phone: '9876543210',
      createdAt: new Date('2026-01-01T00:00:00.000Z')
    });

    expect(id).toBeGreaterThan(0);
    expect(dao.getAllActive().map((c) => c.id)).toEqual([id]);
  });

  it('returns active customers oldest-first', () => {
    const first = dao.insert({ name: 'Rakesh', createdAt: new Date('2026-01-01T00:00:00.000Z') });
    const second = dao.insert({ name: 'Suresh', createdAt: new Date('2026-01-02T00:00:00.000Z') });

    expect(dao.getAllActive().map((c) => c.id)).toEqual([first, second]);
  });

  it('soft-deletes — excluded from the active list, row remains', () => {
    const id = dao.insert({ name: 'Rakesh', createdAt: new Date('2026-01-01T00:00:00.000Z') });

    dao.softDelete(id);

    expect(dao.getAllActive()).toHaveLength(0);
  });
});
