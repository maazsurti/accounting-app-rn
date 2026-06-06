export const CREDIT_ENTRY_TYPES = ['given', 'received'] as const;

/** `given` — merchant gave credit to customer (udhaar). `received` — payment received (vasuli). */
export type CreditEntryType = (typeof CREDIT_ENTRY_TYPES)[number];

export interface CreditEntryProps {
  id?: number | null;
  customerId: number;
  amount: number;
  type: CreditEntryType;
  note?: string | null;
  date: Date;
  createdAt: Date;
  reminderAt?: Date | null;
}

export class CreditEntry {
  readonly id: number | null;
  readonly customerId: number;
  readonly amount: number;
  readonly type: CreditEntryType;
  readonly note: string | null;
  readonly date: Date;
  readonly createdAt: Date;
  readonly reminderAt: Date | null;

  constructor(props: CreditEntryProps) {
    this.id = props.id ?? null;
    this.customerId = props.customerId;
    this.amount = props.amount;
    this.type = props.type;
    this.note = props.note ?? null;
    this.date = props.date;
    this.createdAt = props.createdAt;
    this.reminderAt = props.reminderAt ?? null;
  }

  get isGiven(): boolean {
    return this.type === 'given';
  }

  get isReceived(): boolean {
    return this.type === 'received';
  }

  copyWith(changes: Partial<CreditEntryProps>): CreditEntry {
    return new CreditEntry({ ...this, ...changes });
  }
}
