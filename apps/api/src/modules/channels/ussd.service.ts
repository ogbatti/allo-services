import { Injectable } from "@nestjs/common";
import type {
  JourneyDefinition,
  JourneyStep,
  LocaleCode,
  TenantConfig,
} from "@allo/shared";
import {
  SERVICE_CODE_ORDER,
  getServicePack,
  moduleForService,
  packLabel,
  pickLocale,
} from "@allo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { CasesService } from "../cases/cases.service";
import { JourneysService } from "../journeys/journeys.service";
import { PaymentsService } from "../payments/payments.service";
import { TenantsService } from "../tenants/tenants.service";
import {
  ChannelSessionDto,
  normalizeSessionChannel,
  type SessionChannel,
} from "./dto";

const HOME_STEP = "__home__";
const SESSION_TTL_MS = 72 * 60 * 60 * 1000;

@Injectable()
export class UssdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
    private readonly journeys: JourneysService,
    private readonly cases: CasesService,
    private readonly payments: PaymentsService,
  ) {}

  async handle(dto: ChannelSessionDto) {
    const tenant = this.tenants.get(dto.tenantId);
    const locale = (dto.locale ?? tenant.defaultLocale) as LocaleCode;
    const channel = normalizeSessionChannel(dto.channel);

    let session = dto.sessionId
      ? await this.prisma.channelSession.findUnique({
          where: { id: dto.sessionId },
        })
      : null;

    if (!session || session.expiresAt < new Date()) {
      const initialAnswers: Record<string, string> = {};
      if (channel === "agent" && dto.agentName?.trim()) {
        initialAnswers.agentName = dto.agentName.trim();
      }

      session = await this.prisma.channelSession.create({
        data: {
          tenantId: tenant.id,
          channel,
          phoneNumber: dto.phoneNumber,
          locale,
          journeyId: null,
          currentStepId: HOME_STEP,
          answersJson: JSON.stringify(initialAnswers),
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      });

      return {
        sessionId: session.id,
        continue: true,
        message: this.homePrompt(tenant, locale, channel),
        stepId: HOME_STEP,
        channel,
      };
    }

    const answers = JSON.parse(session.answersJson) as Record<string, string>;
    if (channel === "agent" && dto.agentName?.trim() && !answers.agentName) {
      answers.agentName = dto.agentName.trim();
    }
    const input = (dto.input ?? "").trim();
    const sessionChannel = normalizeSessionChannel(session.channel);

    if (!session.journeyId || session.currentStepId === HOME_STEP) {
      return this.handleHome({
        sessionId: session.id,
        input,
        answers,
        locale,
        phoneNumber: dto.phoneNumber,
        tenant,
        channel: sessionChannel,
      });
    }

    const journey = this.journeys.get(session.journeyId, tenant.id);
    const currentStep = this.journeys.getStep(
      journey,
      session.currentStepId ?? journey.startStepId,
    );

    const next = await this.advance({
      journey,
      step: currentStep,
      input,
      answers,
      locale,
      phoneNumber: dto.phoneNumber,
      tenantId: tenant.id,
      channel: sessionChannel,
    });

    await this.prisma.channelSession.update({
      where: { id: session.id },
      data: {
        currentStepId: next.stepId,
        answersJson: JSON.stringify(next.answers),
        caseId: next.caseId ?? session.caseId,
        locale,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    return {
      sessionId: session.id,
      continue: next.continue,
      message: next.message,
      stepId: next.stepId,
      trackingNumber: next.trackingNumber,
      channel: sessionChannel,
    };
  }

  /** Menu entries = tenant journeys whose service-pack module is enabled. */
  private catalogForTenant(tenant: TenantConfig) {
    const enabled = this.journeys
      .list(tenant.id)
      .filter((j) => {
        const mod = moduleForService(j.serviceCode);
        return mod ? tenant.modules.includes(mod) : false;
      })
      .sort((a, b) => {
        const ia = SERVICE_CODE_ORDER.indexOf(
          a.serviceCode as (typeof SERVICE_CODE_ORDER)[number],
        );
        const ib = SERVICE_CODE_ORDER.indexOf(
          b.serviceCode as (typeof SERVICE_CODE_ORDER)[number],
        );
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

    return enabled.map((journey, index) => ({
      key: String(index + 1),
      journeyId: journey.id,
      serviceCode: journey.serviceCode,
      title: journey.title,
    }));
  }

  private homePrompt(
    tenant: TenantConfig,
    locale: LocaleCode,
    channel: SessionChannel = "ussd",
  ): string {
    const country = pickLocale(tenant.name, locale);
    const mode =
      channel === "agent"
        ? locale === "en"
          ? " — Agent desk"
          : " — Guichet agent"
        : channel === "whatsapp"
          ? " — WhatsApp"
          : channel === "voice"
            ? locale === "en"
              ? " — Voice IVR"
              : " — Serveur vocal"
            : "";
    const lines = [`Allô Services ${country}${mode}`];
    for (const entry of this.catalogForTenant(tenant)) {
      const pack = getServicePack(entry.serviceCode);
      const label =
        packLabel(pack, locale) || pickLocale(entry.title, locale);
      lines.push(`${entry.key}. ${label}`);
    }
    const endsSession = channel !== "ussd";
    lines.push(
      locale === "en"
        ? endsSession
          ? "0. End"
          : "0. Agent"
        : locale === "ee"
          ? "0. Ame"
          : endsSession
            ? "0. Terminer"
            : "0. Agent",
    );
    return lines.join("\n");
  }

  private async handleHome(params: {
    sessionId: string;
    input: string;
    answers: Record<string, string>;
    locale: LocaleCode;
    phoneNumber: string;
    tenant: TenantConfig;
    channel: SessionChannel;
  }) {
    const { sessionId, input, answers, locale, tenant, channel } = params;
    const catalog = this.catalogForTenant(tenant);

    if (!input) {
      return {
        sessionId,
        continue: true,
        message: this.homePrompt(tenant, locale, channel),
        stepId: HOME_STEP,
        channel,
      };
    }

    if (input === "0") {
      await this.prisma.channelSession.update({
        where: { id: sessionId },
        data: {
          currentStepId: "end_agent",
          answersJson: JSON.stringify(answers),
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      });
      return {
        sessionId,
        continue: false,
        message:
          channel !== "ussd"
            ? locale === "en"
              ? "Session closed."
              : "Session terminée."
            : locale === "en"
              ? "An agent will call you shortly."
              : "Un agent vous rappellera sous peu.",
        stepId: "end_agent",
        channel,
      };
    }

    const service = catalog.find((c) => c.key === input);
    if (!service) {
      return {
        sessionId,
        continue: true,
        message:
          (locale === "en" ? "Invalid choice.\n" : "Choix invalide.\n") +
          this.homePrompt(tenant, locale, channel),
        stepId: HOME_STEP,
        channel,
      };
    }

    const journey = this.journeys.get(service.journeyId, tenant.id);
    answers.serviceChoice = input;
    const start = this.journeys.getStep(journey, journey.startStepId);

    await this.prisma.channelSession.update({
      where: { id: sessionId },
      data: {
        journeyId: journey.id,
        currentStepId: start.id,
        answersJson: JSON.stringify(answers),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    return {
      sessionId,
      continue: true,
      message: this.journeys.renderPrompt(start, locale),
      stepId: start.id,
      channel,
    };
  }

  private async advance(params: {
    journey: JourneyDefinition;
    step: JourneyStep;
    input: string;
    answers: Record<string, string>;
    locale: LocaleCode;
    phoneNumber: string;
    tenantId: string;
    channel: SessionChannel;
  }): Promise<{
    stepId: string;
    answers: Record<string, string>;
    continue: boolean;
    message: string;
    caseId?: string;
    trackingNumber?: string;
  }> {
    const {
      journey,
      step,
      input,
      answers,
      locale,
      phoneNumber,
      tenantId,
      channel,
    } = params;

    if (step.type === "menu" || step.type === "confirm") {
      const option = step.options?.find((o) => o.key === input);
      if (!option) {
        return {
          stepId: step.id,
          answers,
          continue: true,
          message:
            (locale === "en"
              ? "Invalid choice.\n"
              : locale === "ee"
                ? "Tiatia mesɔ o.\n"
                : "Choix invalide.\n") +
            this.journeys.renderPrompt(step, locale),
        };
      }
      if (step.field) {
        answers[step.field] =
          option.label?.[locale] ?? option.label?.fr ?? option.key;
      }
      return this.enterStep({
        journey,
        stepId: option.next,
        answers,
        locale,
        phoneNumber,
        tenantId,
        channel,
      });
    }

    if (step.type === "input") {
      const error = this.validateInput(step, input, locale);
      if (error) {
        return {
          stepId: step.id,
          answers,
          continue: true,
          message: `${error}\n${this.journeys.renderPrompt(step, locale)}`,
        };
      }
      if (step.field) {
        answers[step.field] = input;
      }
      return this.enterStep({
        journey,
        stepId: step.next ?? "end_cancelled",
        answers,
        locale,
        phoneNumber,
        tenantId,
        channel,
      });
    }

    if (step.type === "payment" || step.type === "end") {
      return {
        stepId: step.id,
        answers,
        continue: false,
        message: this.journeys.renderPrompt(step, locale, {
          trackingNumber: answers.trackingNumber ?? "",
        }),
      };
    }

    return {
      stepId: step.id,
      answers,
      continue: false,
      message: this.journeys.renderPrompt(step, locale),
    };
  }

  private async enterStep(params: {
    journey: JourneyDefinition;
    stepId: string;
    answers: Record<string, string>;
    locale: LocaleCode;
    phoneNumber: string;
    tenantId: string;
    channel: SessionChannel;
  }): Promise<{
    stepId: string;
    answers: Record<string, string>;
    continue: boolean;
    message: string;
    caseId?: string;
    trackingNumber?: string;
  }> {
    const step = this.journeys.getStep(params.journey, params.stepId);

    if (step.type === "payment") {
      const created = await this.cases.create({
        tenantId: params.tenantId,
        journeyId: params.journey.id,
        phoneNumber: params.phoneNumber,
        locale: params.locale,
        channel: params.channel,
        answers: params.answers,
      });

      if (created.feeAmount > 0) {
        await this.payments.payByTrackingNumber(created.trackingNumber, {
          phoneNumber: params.phoneNumber,
        });
      }

      params.answers.trackingNumber = created.trackingNumber;
      const end = this.journeys.getStep(
        params.journey,
        step.next ?? "end_success",
      );
      return {
        stepId: end.id,
        answers: params.answers,
        continue: false,
        caseId: created.id,
        trackingNumber: created.trackingNumber,
        message: this.journeys.renderPrompt(end, params.locale, {
          trackingNumber: created.trackingNumber,
        }),
      };
    }

    if (step.type === "end") {
      return {
        stepId: step.id,
        answers: params.answers,
        continue: false,
        message: this.journeys.renderPrompt(step, params.locale, {
          trackingNumber: params.answers.trackingNumber ?? "",
        }),
      };
    }

    return {
      stepId: step.id,
      answers: params.answers,
      continue: true,
      message: this.journeys.renderPrompt(step, params.locale),
    };
  }

  private validateInput(
    step: JourneyStep,
    input: string,
    locale: LocaleCode,
  ): string | null {
    if (!input) {
      return locale === "en"
        ? "Please enter a value."
        : locale === "ee"
          ? "Ta ŋlɔ naneke."
          : "Veuillez saisir une valeur.";
    }
    const v = step.validation;
    if (!v) return null;
    if (v.minLength && input.length < v.minLength) {
      return locale === "en" ? "Value too short." : "Valeur trop courte.";
    }
    if (v.maxLength && input.length > v.maxLength) {
      return locale === "en" ? "Value too long." : "Valeur trop longue.";
    }
    if (v.pattern && !new RegExp(v.pattern).test(input)) {
      return locale === "en" ? "Invalid format." : "Format invalide.";
    }
    return null;
  }
}
