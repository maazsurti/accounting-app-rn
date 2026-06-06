import type { ItemUnit } from '@/features/inventory/models/item';

export interface TransactionProps {
  id?: number | null;
  itemId: number;
  itemName: string;
  itemUnit: ItemUnit;
  quantity: number;
  sellingPriceAtTime: number;
  costPriceAtTime: number;
  soldAt: Date;
  batchId?: number | null;
}

export class Transaction {
  readonly id: number | null;
  readonly itemId: number;
  readonly itemName: string;
  readonly itemUnit: ItemUnit;
  readonly quantity: number;
  readonly sellingPriceAtTime: number;
  readonly costPriceAtTime: number;
  readonly soldAt: Date;
  readonly batchId: number | null;

  constructor(props: TransactionProps) {
    this.id = props.id ?? null;
    this.itemId = props.itemId;
    this.itemName = props.itemName;
    this.itemUnit = props.itemUnit;
    this.quantity = props.quantity;
    this.sellingPriceAtTime = props.sellingPriceAtTime;
    this.costPriceAtTime = props.costPriceAtTime;
    this.soldAt = props.soldAt;
    this.batchId = props.batchId ?? null;
  }

  get revenue(): number {
    return this.sellingPriceAtTime * this.quantity;
  }

  get cost(): number {
    return this.costPriceAtTime * this.quantity;
  }

  get profit(): number {
    return this.revenue - this.cost;
  }
}
