import type { AppDatabase } from '../client';
import { createTestDb } from '../test-utils/test-db';
import { TransactionModificationDao } from './transaction-modification-dao';

describe('TransactionModificationDao', () => {
  let db: AppDatabase;
  let dao: TransactionModificationDao;

  beforeEach(() => {
    db = createTestDb();
    dao = new TransactionModificationDao(db);
  });

  it('inserts an audit-log row and returns its id', () => {
    const id = dao.insertModification({
      transactionId: 1,
      action: 'edit',
      itemName: 'Sugar',
      oldQuantity: 1,
      newQuantity: 2,
      oldSellingPrice: 45,
      newSellingPrice: 50,
      modifiedAt: new Date('2026-01-10T00:00:00.000Z')
    });

    expect(id).toBeGreaterThan(0);
  });

  it('keeps the audit row independent of the transactions table — not an FK', () => {
    // transaction_id 999 does not exist in `transactions`; insert must still succeed
    // so the audit trail survives the source transaction being deleted.
    expect(() =>
      dao.insertModification({
        transactionId: 999,
        action: 'delete',
        itemName: 'Sugar',
        oldQuantity: 3,
        newQuantity: null,
        oldSellingPrice: 45,
        newSellingPrice: null,
        modifiedAt: new Date('2026-01-10T00:00:00.000Z')
      })
    ).not.toThrow();
  });
});
