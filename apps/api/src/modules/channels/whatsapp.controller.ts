import { Body, Controller, Post } from "@nestjs/common";
import { ChannelSessionDto } from "./dto";
import { UssdService } from "./ussd.service";

/** WhatsApp inbound stub — same journeys as USSD, channel=whatsapp. */
@Controller("channels/whatsapp")
export class WhatsappController {
  constructor(private readonly sessions: UssdService) {}

  @Post()
  handle(@Body() dto: ChannelSessionDto) {
    return this.sessions.handle({
      ...dto,
      channel: "whatsapp",
    });
  }
}
