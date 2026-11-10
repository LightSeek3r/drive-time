// No @types/node in this project; this file runs in Vitest's Node main process only.
declare const process: { env: Record<string, string | undefined> };

/** Runs before test workers start, so every worker inherits a fixed zone with real DST rules. */
export default function setup(): void {
  process.env.TZ = 'Europe/Paris';
}
