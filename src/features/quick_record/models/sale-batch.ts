export interface SaleBatch {
  readonly id: number;
  readonly customerName: string | null;
  readonly customerPhone: string | null;
  readonly createdAt: Date;
}
