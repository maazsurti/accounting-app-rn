export interface CustomerProps {
  id?: number | null;
  name: string;
  phone?: string | null;
  createdAt: Date;
  deletedAt?: Date | null;
}

export class Customer {
  readonly id: number | null;
  readonly name: string;
  readonly phone: string | null;
  readonly createdAt: Date;
  readonly deletedAt: Date | null;

  constructor(props: CustomerProps) {
    this.id = props.id ?? null;
    this.name = props.name;
    this.phone = props.phone ?? null;
    this.createdAt = props.createdAt;
    this.deletedAt = props.deletedAt ?? null;
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  copyWith(changes: Partial<CustomerProps>): Customer {
    return new Customer({ ...this, ...changes });
  }
}
