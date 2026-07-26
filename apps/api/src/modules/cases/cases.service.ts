import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { CaseStatus, ChannelCode, LocaleCode } from "@allo/shared";
import {
  fillTemplate,
  getServicePack,
  pickLocale,
} from "@allo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { JourneysService } from "../journeys/journeys.service";
import { NotificationsService } from "../notifications/notifications.service";
import { TenantsService } from "../tenants/tenants.service";
import { CreateCaseDto, InstructCaseDto } from "./dto";

const ALLOWED_TRANSITIONS: Record<string, CaseStatus[]> = {
  awaiting_payment: ["cancelled"],
  in_review: ["incomplete", "ready", "rejected"],
  incomplete: ["in_review", "rejected", "cancelled"],
  ready: ["delivered", "closed"],
  delivered: ["closed"],
  rejected: ["closed", "in_review"],
};

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
    const answers = dto.answers ?? {};
    const parsedBill = Number(answers.billAmount ?? "");
    const feeAmount =
      Number.isFinite(parsedBill) && parsedBill > 0
        ? Math.round(parsedBill)
        : journey.feeAmount;
    const initialStatus: CaseStatus =
      feeAmount > 0 ? "awaiting_payment" : "in_review";

    const created = await this.prisma.case.create({
      data: {
        trackingNumber,
        tenantId: tenant.id,
        serviceCode: journey.serviceCode,
        journeyId: journey.id,
        journeyVersion: journey.version,
        status: initialStatus,
        channel,
        phoneNumber: dto.phoneNumber,
        locale,
        payloadJson: JSON.stringify(answers),
        feeAmount,
        feeCurrency: journey.feeCurrency,
        statusEvents: {
          create: {
            fromStatus: null,
            toStatus: initialStatus,
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
          ? `Allô Services: request registered. Tracking: ${trackingNumber}.${feeAmount > 0 ? ` Fee: ${feeAmount} ${journey.feeCurrency}.` : ""}`
          : locale === "ee"
            ? `Allô Services: biabia wɔe. Dzodzro: ${trackingNumber}.${feeAmount > 0 ? ` Ga: ${feeAmount} ${journey.feeCurrency}.` : ""}`
            : `Allô Services: demande enregistrée. Suivi: ${trackingNumber}.${feeAmount > 0 ? ` Frais: ${feeAmount} ${journey.feeCurrency}.` : ""}`,
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
      allowedTransitions: ALLOWED_TRANSITIONS[item.status] ?? [],
    };
  }

  async list(tenantId?: string, status?: string, serviceCode?: string) {
    const items = await this.prisma.case.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(status ? { status } : {}),
        ...(serviceCode ? { serviceCode } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return items.map((item) => ({
      ...this.toSummary(item),
      payload: JSON.parse(item.payloadJson) as Record<string, string>,
      allowedTransitions: ALLOWED_TRANSITIONS[item.status] ?? [],
    }));
  }

  /** Cases waiting for communal / admin instruction */
  async inbox(tenantId: string) {
    this.tenants.get(tenantId);
    return this.list(tenantId, "in_review");
  }

  async instruct(trackingNumber: string, dto: InstructCaseDto) {
    const current = await this.prisma.case.findUnique({
      where: { trackingNumber },
    });
    if (!current) {
      throw new NotFoundException({
        fr: `Dossier introuvable: ${trackingNumber}`,
        en: `Case not found: ${trackingNumber}`,
      });
    }

    const allowed = ALLOWED_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(dto.toStatus)) {
      throw new BadRequestException({
        fr: `Transition interdite: ${current.status} → ${dto.toStatus}`,
        en: `Transition not allowed: ${current.status} → ${dto.toStatus}`,
      });
    }

    if (dto.toStatus === "rejected" && !dto.note?.trim()) {
      throw new BadRequestException({
        fr: "Un motif de rejet est obligatoire.",
        en: "A rejection reason is required.",
      });
    }

    if (dto.toStatus === "incomplete" && !dto.note?.trim()) {
      throw new BadRequestException({
        fr: "Précisez la pièce ou l'information manquante.",
        en: "Specify the missing document or information.",
      });
    }

    const updated = await this.transition(
      current.id,
      dto.toStatus,
      (dto.actor ?? "instructeur").trim(),
      dto.note?.trim(),
    );

    await this.notifyStatusChange({
      tenantId: current.tenantId,
      caseId: current.id,
      trackingNumber: current.trackingNumber,
      phoneNumber: current.phoneNumber,
      locale: current.locale as LocaleCode,
      serviceCode: current.serviceCode,
      toStatus: dto.toStatus,
      note: dto.note?.trim(),
    });

    return this.findByTrackingNumber(updated.trackingNumber);
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

  private async notifyStatusChange(params: {
    tenantId: string;
    caseId: string;
    trackingNumber: string;
    phoneNumber: string;
    locale: LocaleCode;
    serviceCode: string;
    toStatus: CaseStatus;
    note?: string;
  }) {
    const { locale, trackingNumber, toStatus, note, serviceCode } = params;
    const pack = getServicePack(serviceCode);
    const vars = {
      trackingNumber,
      note: note?.trim() || "—",
    };

    let template: string | null = null;
    if (toStatus === "ready") {
      template = pickLocale(pack.sms.ready, locale);
    } else if (toStatus === "rejected") {
      template = pickLocale(pack.sms.rejected, locale);
    } else if (toStatus === "incomplete") {
      template = pickLocale(pack.sms.incomplete, locale);
    } else if (toStatus === "delivered") {
      template = pickLocale(pack.sms.delivered, locale);
    }

    if (!template) return;

    await this.notifications.sendSms({
      tenantId: params.tenantId,
      caseId: params.caseId,
      recipient: params.phoneNumber,
      body: fillTemplate(template, vars),
    });
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
