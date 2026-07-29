import { Body, Controller, Post } from "@nestjs/common";
import { ChannelSessionDto } from "./dto";
import { UssdService } from "./ussd.service";

/** Voice IVR inbound stub — same journeys as USSD, channel=voice. */
@Controller("channels/voice")
export class VoiceController {
  constructor(private readonly sessions: UssdService) {}

  @Post()
  handle(@Body() dto: ChannelSessionDto) {
    return this.sessions.handle({
      ...dto,
      channel: "voice",
    });
  }
}
