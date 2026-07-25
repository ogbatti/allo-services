import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { createHash } from "node:crypto";
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

    // Simulator — always succeeds for demo; swap with MM connector later
    const externalRef = `SIM-${Date.now()}`;
    this.logger.log(
      `[PAY-SIM] case=${summary.trackingNumber} amount=${summary.feeAmount} ${summary.feeCurrency} phone=${dto.phoneNumber}`,
    );

    const payment = await this.prisma.payment.create({
      data: {
        tenantId: summary.tenantId,
        caseId: summary.id,
        provider: "simulator",
        amount: summary.feeAmount,
        currency: summary.feeCurrency,
        status: "succeeded",
        externalRef,
        phoneNumber: dto.phoneNumber,
        idempotencyKey,
      },
    });

    await this.cases.transition(
      summary.id,
      "in_review",
      "payment-simulator",
      `Payment ${externalRef} succeeded`,
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
