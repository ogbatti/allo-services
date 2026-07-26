import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { ConnectorRegistry } from "../../connectors/connector.registry";
import { PrismaService } from "../../prisma/prisma.service";
import { CasesService } from "../cases/cases.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PayCaseDto } from "./dto";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cases: CasesService,
    private readonly notifications: NotificationsService,
    private readonly connectors: ConnectorRegistry,
  ) {}

  async payByTrackingNumber(trackingNumber: string, dto: PayCaseDto) {
    const summary = await this.cases.findByTrackingNumber(trackingNumber);
    if (summary.status !== "awaiting_payment") {
      throw new BadRequestException({
        fr: `Paiement impossible pour le statut ${summary.status}`,
        en: `Payment not allowed for status ${summary.status}`,
      });
    }

    const idempotencyKey =
      dto.idempotencyKey ??
      createHash("sha256")
        .update(`${summary.id}:${dto.phoneNumber}:pay`)
        .digest("hex")
        .slice(0, 32);

    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return existing;
    }

    const connector = this.connectors.paymentForTenant(summary.tenantId);
    const charge = await connector.charge({
      tenantId: summary.tenantId,
      caseId: summary.id,
      trackingNumber: summary.trackingNumber,
      amount: summary.feeAmount,
      currency: summary.feeCurrency,
      phoneNumber: dto.phoneNumber,
      idempotencyKey,
    });

    if (charge.status !== "succeeded") {
      this.logger.warn(
        `Payment failed via ${connector.id}: ${charge.rawMessage ?? charge.status}`,
      );
      await this.prisma.payment.create({
        data: {
          tenantId: summary.tenantId,
          caseId: summary.id,
          provider: charge.provider,
          amount: summary.feeAmount,
          currency: summary.feeCurrency,
          status: "failed",
          externalRef: charge.externalRef,
          phoneNumber: dto.phoneNumber,
          idempotencyKey: `${idempotencyKey}:failed:${Date.now()}`,
        },
      });
      throw new BadRequestException({
        fr: `Paiement refusé (${connector.id})`,
        en: `Payment declined (${connector.id})`,
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        tenantId: summary.tenantId,
        caseId: summary.id,
        provider: charge.provider,
        amount: summary.feeAmount,
        currency: summary.feeCurrency,
        status: "succeeded",
        externalRef: charge.externalRef,
        phoneNumber: dto.phoneNumber,
        idempotencyKey,
      },
    });

    await this.cases.transition(
      summary.id,
      "in_review",
      `payment-${charge.provider}`,
      `Payment ${charge.externalRef} succeeded via ${charge.provider}`,
    );

    const locale = summary.locale;
    await this.notifications.sendSms({
      tenantId: summary.tenantId,
      caseId: summary.id,
      recipient: summary.phoneNumber,
      body:
        locale === "en"
          ? `Allô Services: payment received (${summary.feeAmount} ${summary.feeCurrency}). Tracking ${summary.trackingNumber} is now in review.`
          : locale === "ee"
            ? `Allô Services: gaƒoƒo xɔ (${summary.feeAmount} ${summary.feeCurrency}). Dzodzro ${summary.trackingNumber} le nkɔkplɔm.`
            : `Allô Services: paiement reçu (${summary.feeAmount} ${summary.feeCurrency}). Dossier ${summary.trackingNumber} en instruction.`,
    });

    return payment;
  }
}
