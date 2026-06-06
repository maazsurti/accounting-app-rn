import { customType } from 'drizzle-orm/sqlite-core';

/**
 * Mirrors drift's `dateTime()` with `storeDateTimeAsText: true`: stored as an
 * ISO-8601 string in SQLite, surfaced as `Date` in typed query results.
 */
export const isoDateTime = customType<{ data: Date; driverData: string }>({
  dataType() {
    return 'text';
  },
  toDriver(value: Date): string {
    return value.toISOString();
  },
  fromDriver(value: string): Date {
    return new Date(value);
  }
});
