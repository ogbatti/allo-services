import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export type AuditFilters = {
  tenantId: string;
  serviceCode?: string;
  toStatus?: string;
  from?: string;
  to?: string;
  actor?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: AuditFilters) {
    const items = await this.prisma.caseStatusEvent.findMany({
      where: {
        actor: filters.actor ? { contains: filters.actor } : undefined,
        toStatus: filters.toStatus,
        createdAt:
          filters.from || filters.to
            ? {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              }
            : undefined,
        case: {
          tenantId: filters.tenantId,
          ...(filters.serviceCode ? { serviceCode: filters.serviceCode } : {}),
        },
      },
      include: {
        case: {
          select: {
            trackingNumber: true,
            tenantId: true,
            serviceCode: true,
            status: true,
            channel: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return items.map((item) => ({
      id: item.id,
      createdAt: item.createdAt.toISOString(),
      actor: item.actor,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      note: item.note,
      trackingNumber: item.case.trackingNumber,
      tenantId: item.case.tenantId,
      serviceCode: item.case.serviceCode,
      caseStatus: item.case.status,
      channel: item.case.channel,
      phoneNumber: item.case.phoneNumber,
    }));
  }

  async exportCsv(filters: AuditFilters) {
    const rows = await this.list(filters);
    const header = [
      "createdAt",
      "tenantId",
      "trackingNumber",
      "serviceCode",
      "channel",
      "phoneNumber",
      "actor",
      "fromStatus",
      "toStatus",
      "caseStatus",
      "note",
    ];

    const escape = (value: unknown) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;

    return [
      header.join(","),
      ...rows.map((row) =>
        [
          row.createdAt,
          row.tenantId,
          row.trackingNumber,
          row.serviceCode,
          row.channel,
          row.phoneNumber,
          row.actor,
          row.fromStatus ?? "",
          row.toStatus,
          row.caseStatus,
          row.note ?? "",
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n");
  }
}
