import { Injectable, Logger } from "@nestjs/common";
import { ConnectorRegistry } from "../../connectors/connector.registry";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantsService } from "../tenants/tenants.service";

interface SendSmsInput {
  tenantId: string;
  caseId?: string;
  recipient: string;
  body: string;
}

interface SendWhatsappInput {
  tenantId: string;
  caseId?: string;
  recipient: string;
  body: string;
}

interface PlaceVoiceCallInput {
  tenantId: string;
  caseId?: string;
  recipient: string;
  script: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
    private readonly connectors: ConnectorRegistry,
  ) {}

  async sendSms(input: SendSmsInput) {
    const tenant = this.tenants.get(input.tenantId);
    const connector = this.connectors.smsForTenant(input.tenantId);
    const result = await connector.send({
      tenantId: input.tenantId,
      senderId: tenant.smsSenderId,
      recipient: input.recipient,
      body: input.body,
      caseId: input.caseId,
    });

    if (result.status === "failed") {
      this.logger.warn(
        `SMS failed via ${connector.id}: ${result.rawMessage ?? "unknown"}`,
      );
    }

    return this.prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        caseId: input.caseId,
        channel: "sms",
        recipient: input.recipient,
        senderId: tenant.smsSenderId,
        body: input.body,
        status: result.status,
        provider: result.provider,
        costEstimate: result.costEstimate ?? null,
      },
    });
  }

  async sendWhatsapp(input: SendWhatsappInput) {
    const tenant = this.tenants.get(input.tenantId);
    const connector = this.connectors.whatsappForTenant(input.tenantId);
    const result = await connector.send({
      tenantId: input.tenantId,
      senderId: tenant.smsSenderId,
      recipient: input.recipient,
      body: input.body,
      caseId: input.caseId,
    });

    if (result.status === "failed") {
      this.logger.warn(
        `WhatsApp failed via ${connector.id}: ${result.rawMessage ?? "unknown"}`,
      );
    }

    return this.prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        caseId: input.caseId,
        channel: "whatsapp",
        recipient: input.recipient,
        senderId: tenant.smsSenderId,
        body: input.body,
        status: result.status,
        provider: result.provider,
        costEstimate: result.costEstimate ?? null,
      },
    });
  }

  async placeVoiceCall(input: PlaceVoiceCallInput) {
    const tenant = this.tenants.get(input.tenantId);
    const connector = this.connectors.voiceForTenant(input.tenantId);
    const result = await connector.call({
      tenantId: input.tenantId,
      fromNumber: tenant.voiceShortNumber,
      recipient: input.recipient,
      script: input.script,
      caseId: input.caseId,
    });

    if (result.status === "failed") {
      this.logger.warn(
        `Voice call failed via ${connector.id}: ${result.rawMessage ?? "unknown"}`,
      );
    }

    return this.prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        caseId: input.caseId,
        channel: "voice",
        recipient: input.recipient,
        senderId: tenant.voiceShortNumber,
        body: input.script,
        status: result.status,
        provider: result.provider,
        costEstimate: result.costEstimate ?? null,
      },
    });
  }

  list(tenantId?: string) {
    return this.prisma.notification.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
