import type { RecentCustomer, SaleBatchDao } from '@/core/db/daos/sale-batch-dao';

export class SaleBatchRepository {
  constructor(private readonly dao: SaleBatchDao) {}

  insertBatch(params: { name: string | null; phone: string | null }): number {
    return this.dao.insertBatch({
      customerName: params.name,
      customerPhone: params.phone,
      createdAt: new Date()
    });
  }

  getRecentCustomers(): RecentCustomer[] {
    return this.dao.getRecentCustomers();
  }
}
