import type { BaseModel } from '@/core/models/base-model';

export const ITEM_UNITS = ['piece', 'kg', 'gram', 'litre', 'dozen', 'metre'] as const;

export type ItemUnit = (typeof ITEM_UNITS)[number];

const ITEM_UNIT_LABELS: Record<ItemUnit, string> = {
  piece: 'Piece',
  kg: 'kg',
  gram: 'gram',
  litre: 'litre',
  dozen: 'Dozen',
  metre: 'metre'
};

/** English fallback label — `useL10n()` (1.7) supplies the localized form once it lands. */
export function itemUnitLabel(unit: ItemUnit): string {
  return ITEM_UNIT_LABELS[unit];
}

export interface ItemProps {
  id?: number | null;
  name: string;
  sellingPrice: number;
  totalPurchasePrice: number;
  purchasedQty: number;
  currentStock: number;
  imagePath?: string | null;
  lowStockThreshold?: number | null;
  unit: ItemUnit;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  isStarred?: boolean;
}

export class Item implements BaseModel {
  readonly id: number | null;
  readonly name: string;
  readonly sellingPrice: number;
  readonly totalPurchasePrice: number;
  readonly purchasedQty: number;
  readonly currentStock: number;
  readonly imagePath: string | null;
  readonly lowStockThreshold: number | null;
  readonly unit: ItemUnit;
  readonly createdAt: Date;
  readonly updatedAt: Date | null;
  readonly deletedAt: Date | null;
  readonly isStarred: boolean;

  constructor(props: ItemProps) {
    this.id = props.id ?? null;
    this.name = props.name;
    this.sellingPrice = props.sellingPrice;
    this.totalPurchasePrice = props.totalPurchasePrice;
    this.purchasedQty = props.purchasedQty;
    this.currentStock = props.currentStock;
    this.imagePath = props.imagePath ?? null;
    this.lowStockThreshold = props.lowStockThreshold ?? null;
    this.unit = props.unit;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt ?? null;
    this.deletedAt = props.deletedAt ?? null;
    this.isStarred = props.isStarred ?? false;
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  get isOutOfStock(): boolean {
    return this.currentStock <= 0;
  }

  get costPerUnit(): number {
    return this.purchasedQty > 0 ? this.totalPurchasePrice / this.purchasedQty : 0;
  }

  get margin(): number {
    return this.sellingPrice - this.costPerUnit;
  }

  get effectiveLowStockThreshold(): number {
    return this.lowStockThreshold ?? this.purchasedQty * 0.25;
  }

  get isLowStock(): boolean {
    return this.currentStock <= this.effectiveLowStockThreshold;
  }

  copyWith(changes: Partial<ItemProps>): Item {
    return new Item({ ...this, ...changes });
  }
}
