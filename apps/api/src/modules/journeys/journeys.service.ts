import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { JourneyDefinition, JourneyStep, LocaleCode } from "@allo/shared";
import { pickLocale } from "@allo/shared";
import { resolveConfigDir } from "../../common/paths";

@Injectable()
export class JourneysService implements OnModuleInit {
  private readonly cache = new Map<string, JourneyDefinition>();

  onModuleInit() {
    this.loadFromDisk();
  }

  list(tenantId?: string): JourneyDefinition[] {
    const all = [...this.cache.values()];
    return tenantId ? all.filter((j) => j.tenantId === tenantId) : all;
  }

  get(journeyId: string, tenantId?: string): JourneyDefinition {
    const journey = this.cache.get(journeyId);
    if (!journey || (tenantId && journey.tenantId !== tenantId)) {
      throw new NotFoundException({
        fr: `Parcours inconnu: ${journeyId}`,
        en: `Unknown journey: ${journeyId}`,
      });
    }
    return journey;
  }

  getStep(journey: JourneyDefinition, stepId: string): JourneyStep {
    const step = journey.steps.find((s) => s.id === stepId);
    if (!step) {
      throw new NotFoundException({
        fr: `Étape inconnue: ${stepId}`,
        en: `Unknown step: ${stepId}`,
      });
    }
    return step;
  }

  renderPrompt(
    step: JourneyStep,
    locale: LocaleCode,
    vars: Record<string, string> = {},
  ): string {
    let text = pickLocale(step.prompt, locale);
    for (const [key, value] of Object.entries(vars)) {
      text = text.replaceAll(`{{${key}}}`, value);
    }
    return text;
  }

  private loadFromDisk() {
    const dir = join(resolveConfigDir(), "journeys");
    const files = readdirSync(dir).filter(
      (f) => f.endsWith(".json") && !f.startsWith("_"),
    );
    for (const file of files) {
      const raw = readFileSync(join(dir, file), "utf8").replace(/^\uFEFF/, "");
      const journey = JSON.parse(raw) as JourneyDefinition;
      this.cache.set(journey.id, journey);
    }
  }
}
