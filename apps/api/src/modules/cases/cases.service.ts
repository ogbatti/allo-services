import { Injectable, NotFoundException } from "@nestjs/common";
import type { CaseStatus, ChannelCode, LocaleCode } from "@allo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { JourneysService } from "../journeys/journeys.service";
import { NotificationsService } from "../notifications/notifications.service";
import { TenantsService } from "../tenants/tenants.service";
import { CreateCaseDto } from "./dto";

@Injectable()
export class CasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
    private readonly journeys: JourneysService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateCaseDto) {
    const tenant = this.tenants.get(dto.tenantId);
    const journey = this.journeys.get(dto.journeyId, dto.tenantId);
    const locale = (dto.locale ?? tenant.defaultLocale) as LocaleCode;
    const channel = (dto.channel ?? "web") as ChannelCode;
    const trackingNumber = this.generateTrackingNumber(tenant.countryCode);

    const created = await this.prisma.case.create({
      data: {
        trackingNumber,
        tenantId: tenant.id,
        serviceCode: journey.serviceCode,
        journeyId: journey.id,
        journeyVersion: journey.version,
        status: "awaiting_payment",
        channel,
        phoneNumber: dto.phoneNumber,
        locale,
        payloadJson: JSON.stringify(dto.answers ?? {}),
        feeAmount: journey.feeAmount,
        feeCurrency: journey.feeCurrency,
        statusEvents: {
          create: {
            fromStatus: null,
            toStatus: "awaiting_payment",
            actor: "system",
            note: "Case created / Dossier créé",
          },
        },
      },
    });

    await this.notifications.sendSms({
      tenantId: tenant.id,
      caseId: created.id,
      recipient: dto.phoneNumber,
      body:
        locale === "en"
          ? `Allô Services: request registered. Tracking: ${trackingNumber}. Fee: ${journey.feeAmount} ${journey.feeCurrency}.`
          : locale === "ee"
            ? `Allô Services: biabia wɔe. Dzodzro: ${trackingNumber}. Ga: ${journey.feeAmount} ${journey.feeCurrency}.`
            : `Allô Services: demande enregistrée. Suivi: ${trackingNumber}. Frais: ${journey.feeAmount} ${journey.feeCurrency}.`,
    });

    return this.toSummary(created);
  }

  async findByTrackingNumber(trackingNumber: string) {
    const item = await this.prisma.case.findUnique({
      where: { trackingNumber },
      include: {
        statusEvents: { orderBy: { createdAt: "asc" } },
        payments: true,
        notifications: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!item) {
      throw new NotFoundException({
        fr: `Dossier introuvable: ${trackingNumber}`,
        en: `Case not found: ${trackingNumber}`,
      });
    }
    return {
      ...this.toSummary(item),
      payload: JSON.parse(item.payloadJson) as Record<string, string>,
      events: item.statusEvents,
      payments: item.payments,
      notifications: item.notifications,
    };
  }

  async list(tenantId?: string) {
    const items = await this.prisma.case.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return items.map((item) => this.toSummary(item));
  }

  async transition(
    caseId: string,
    toStatus: CaseStatus,
    actor: string,
    note?: string,
  ) {
    const current = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!current) {
      throw new NotFoundException({
        fr: `Dossier introuvable: ${caseId}`,
        en: `Case not found: ${caseId}`,
      });
    }

    const updated = await this.prisma.case.update({
      where: { id: caseId },
      data: {
        status: toStatus,
        statusEvents: {
          create: {
            fromStatus: current.status,
            toStatus,
            actor,
            note,
          },
        },
      },
    });

    return this.toSummary(updated);
  }

  async getEntity(caseId: string) {
    const item = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!item) {
      throw new NotFoundException({
        fr: `Dossier introuvable: ${caseId}`,
        en: `Case not found: ${caseId}`,
      });
    }
    return item;
  }

  private generateTrackingNumber(countryCode: string): string {
    const stamp = Date.now().toString().slice(-8);
    const rand = Math.floor(Math.random() * 90 + 10).toString();
    return `${countryCode}${stamp}${rand}`;
  }

  private toSummary(item: {
    id: string;
    trackingNumber: string;
    tenantId: string;
    serviceCode: string;
    status: string;
    channel: string;
    phoneNumber: string;
    locale: string;
    feeAmount: number;
    feeCurrency: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      trackingNumber: item.trackingNumber,
      tenantId: item.tenantId,
      serviceCode: item.serviceCode,
      status: item.status as CaseStatus,
      channel: item.channel as ChannelCode,
      phoneNumber: item.phoneNumber,
      locale: item.locale as LocaleCode,
      feeAmount: item.feeAmount,
      feeCurrency: item.feeCurrency,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
