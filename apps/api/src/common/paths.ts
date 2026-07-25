import { existsSync } from "node:fs";
import { join } from "node:path";

/** Resolve repo-level config/ whether running from apps/api or monorepo root */
export function resolveConfigDir(): string {
  const candidates = [
    join(process.cwd(), "config"),
    join(process.cwd(), "..", "..", "config"),
    join(__dirname, "..", "..", "..", "..", "config"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Unable to locate config/ directory. Run from the monorepo root or apps/api.",
  );
}
