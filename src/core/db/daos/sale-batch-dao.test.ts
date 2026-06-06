import type { AppDatabase } from '../client';
import { createTestDb } from '../test-utils/test-db';
import { SaleBatchDao } from './sale-batch-dao';

describe('SaleBatchDao', () => {
  let db: AppDatabase;
  let dao: SaleBatchDao;

  beforeEach(() => {
    db = createTestDb();
    dao = new SaleBatchDao(db);
  });

  it('inserts a batch and returns its id', () => {
    const id = dao.insertBatch({
      customerName: 'Rakesh',
      customerPhone: '9876543210',
      createdAt: new Date('2026-01-01T00:00:00.000Z')
    });

    expect(id).toBeGreaterThan(0);
  });

  it('returns recent customers newest-first, deduped by name and capped', () => {
    dao.insertBatch({
      customerName: 'Rakesh',
      customerPhone: '9876543210',
      createdAt: new Date('2026-01-01T00:00:00.000Z')
    });
    dao.insertBatch({
      customerName: 'Suresh',
      customerPhone: '9123456780',
      createdAt: new Date('2026-01-02T00:00:00.000Z')
    });
    // Same name again, more recently — first occurrence (newest) wins, no duplicate.
    dao.insertBatch({
      customerName: 'Rakesh',
      customerPhone: '9999999999',
      createdAt: new Date('2026-01-03T00:00:00.000Z')
    });
    // No customer name — excluded entirely.
    dao.insertBatch({
      customerName: null,
      customerPhone: null,
      createdAt: new Date('2026-01-04T00:00:00.000Z')
    });

    expect(dao.getRecentCustomers()).toEqual([
      { name: 'Rakesh', phone: '9999999999' },
      { name: 'Suresh', phone: '9123456780' }
    ]);
  });
});
