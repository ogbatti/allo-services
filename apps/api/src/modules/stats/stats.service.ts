import { Injectable } from "@nestjs/common";
import { getServicePack, packLabel } from "@allo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantsService } from "../tenants/tenants.service";

@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
  ) {}

  async demo(tenantId?: string) {
    const tenantIds = tenantId
      ? [this.tenants.get(tenantId).id]
      : this.tenants.list().map((t) => t.id);

    const tenants = [];
    for (const id of tenantIds) {
      const tenant = this.tenants.get(id);
      const [byStatus, byService, byChannel, smsTotal, paymentsSucceeded] =
        await Promise.all([
          this.prisma.case.groupBy({
            by: ["status"],
            where: { tenantId: id },
            _count: { _all: true },
          }),
          this.prisma.case.groupBy({
            by: ["serviceCode"],
            where: { tenantId: id },
            _count: { _all: true },
          }),
          this.prisma.case.groupBy({
            by: ["channel"],
            where: { tenantId: id },
            _count: { _all: true },
          }),
          this.prisma.notification.count({
            where: { tenantId: id, channel: "sms" },
          }),
          this.prisma.payment.count({
            where: { tenantId: id, status: "succeeded" },
          }),
        ]);

      const casesTotal = byStatus.reduce((sum, row) => sum + row._count._all, 0);

      tenants.push({
        tenantId: id,
        countryCode: tenant.countryCode,
        name: tenant.name,
        casesTotal,
        smsTotal,
        paymentsSucceeded,
        byStatus: Object.fromEntries(
          byStatus.map((r) => [r.status, r._count._all]),
        ),
        byService: byService.map((r) => ({
          serviceCode: r.serviceCode,
          label: packLabel(getServicePack(r.serviceCode), "fr"),
          count: r._count._all,
        })),
        byChannel: Object.fromEntries(
          byChannel.map((r) => [r.channel, r._count._all]),
        ),
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      tenants,
      totals: {
        cases: tenants.reduce((s, t) => s + t.casesTotal, 0),
        sms: tenants.reduce((s, t) => s + t.smsTotal, 0),
        paymentsSucceeded: tenants.reduce(
          (s, t) => s + t.paymentsSucceeded,
          0,
        ),
      },
    };
  }
}
