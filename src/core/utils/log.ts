const isDev = process.env.NODE_ENV !== 'production';

export const Log = {
  error(tag: string, msg: string, error?: unknown): void {
    if (!isDev) return;
    console.error(`❌ [${tag}] ${msg}`, error ?? '');
  },
  warn(tag: string, msg: string): void {
    if (!isDev) return;
    console.warn(`⚠️  [${tag}] ${msg}`);
  },
  info(tag: string, msg: string): void {
    if (!isDev) return;
    console.info(`🔵 [${tag}] ${msg}`);
  },
  ok(tag: string, msg: string): void {
    if (!isDev) return;
    console.log(`✅ [${tag}] ${msg}`);
  },
  db(tag: string, msg: string): void {
    if (!isDev) return;
    console.log(`🗄️  [${tag}] ${msg}`);
  },
  nav(tag: string, msg: string): void {
    if (!isDev) return;
    console.log(`🧭 [${tag}] ${msg}`);
  }
} as const;
