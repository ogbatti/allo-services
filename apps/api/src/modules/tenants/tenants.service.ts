import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { TenantConfig } from "@allo/shared";
import { resolveConfigDir } from "../../common/paths";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TenantsService implements OnModuleInit {
  private readonly cache = new Map<string, TenantConfig>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadFromDiskAndSync();
  }

  list(): TenantConfig[] {
    return [...this.cache.values()];
  }

  get(tenantId: string): TenantConfig {
    const tenant = this.cache.get(tenantId);
    if (!tenant) {
      throw new NotFoundException({
        fr: `Tenant inconnu: ${tenantId}`,
        en: `Unknown tenant: ${tenantId}`,
      });
    }
    return tenant;
  }

  hasModule(tenantId: string, moduleId: string): boolean {
    return this.get(tenantId).modules.includes(moduleId);
  }

  private async loadFromDiskAndSync() {
    const dir = join(resolveConfigDir(), "tenants");
    const files = readdirSync(dir).filter(
      (f) => f.endsWith(".json") && !f.startsWith("_"),
    );

    for (const file of files) {
      const raw = readFileSync(join(dir, file), "utf8");
      const config = JSON.parse(raw) as TenantConfig;
      this.cache.set(config.id, config);

      await this.prisma.tenant.upsert({
        where: { id: config.id },
        create: {
          id: config.id,
          countryCode: config.countryCode,
          nameFr: config.name.fr,
          nameEn: config.name.en ?? null,
          defaultLocale: config.defaultLocale,
          currency: config.currency,
          ussdShortCode: config.ussdShortCode,
          voiceShortNumber: config.voiceShortNumber,
          smsSenderId: config.smsSenderId,
          modulesJson: JSON.stringify(config.modules),
        },
        update: {
          countryCode: config.countryCode,
          nameFr: config.name.fr,
          nameEn: config.name.en ?? null,
          defaultLocale: config.defaultLocale,
          currency: config.currency,
          ussdShortCode: config.ussdShortCode,
          voiceShortNumber: config.voiceShortNumber,
          smsSenderId: config.smsSenderId,
          modulesJson: JSON.stringify(config.modules),
        },
      });
    }
  }
}
