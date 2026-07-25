import { Body, Controller, Param, Post } from "@nestjs/common";
import { PayCaseDto } from "./dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("cases/:trackingNumber")
  pay(
    @Param("trackingNumber") trackingNumber: string,
    @Body() dto: PayCaseDto,
  ) {
    return this.payments.payByTrackingNumber(trackingNumber, dto);
  }
}
