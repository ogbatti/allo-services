import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TenantsService } from "../tenants/tenants.service";

interface SendSmsInput {
  tenantId: string;
  caseId?: string;
  recipient: string;
  body: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
  ) {}

  async sendSms(input: SendSmsInput) {
    const tenant = this.tenants.get(input.tenantId);

    // Simulator provider — replace with real SMS gateway connector later
    this.logger.log(
      `[SMS-SIM] to=${input.recipient} sender=${tenant.smsSenderId} body="${input.body}"`,
    );

    return this.prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        caseId: input.caseId,
        channel: "sms",
        recipient: input.recipient,
        senderId: tenant.smsSenderId,
        body: input.body,
        status: "sent",
        provider: "simulator",
        costEstimate: 15,
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
