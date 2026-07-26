import { Injectable } from "@nestjs/common";
import type { JourneyDefinition, JourneyStep, LocaleCode } from "@allo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { CasesService } from "../cases/cases.service";
import { JourneysService } from "../journeys/journeys.service";
import { PaymentsService } from "../payments/payments.service";
import { TenantsService } from "../tenants/tenants.service";
import { UssdRequestDto } from "./dto";

const HOME_STEP = "__home__";
const SESSION_TTL_MS = 72 * 60 * 60 * 1000;

const SERVICE_CATALOG: Record<
  string,
  { journeyId: string; label: Record<LocaleCode, string> }
> = {
  "1": {
    journeyId: "civil-status-birth-certificate",
    label: {
      fr: "Acte de naissance",
      ee: "Dzidzɔ ŋkɔ ŋuti agbalẽ",
      en: "Birth certificate",
    },
  },
  "2": {
    journeyId: "appointment-booking",
    label: {
      fr: "Rendez-vous",
      ee: "Gbeƒãɖeɖe",
      en: "Appointment",
    },
  },
  "3": {
    journeyId: "bill-payment",
    label: {
      fr: "Paiement facture",
      ee: "Akɔnta gaƒoƒo",
      en: "Bill payment",
    },
  },
};

@Injectable()
export class UssdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
    private readonly journeys: JourneysService,
    private readonly cases: CasesService,
    private readonly payments: PaymentsService,
  ) {}

  async handle(dto: UssdRequestDto) {
    const tenant = this.tenants.get(dto.tenantId);
    const locale = (dto.locale ?? tenant.defaultLocale) as LocaleCode;

    let session = dto.sessionId
      ? await this.prisma.channelSession.findUnique({
          where: { id: dto.sessionId },
        })
      : null;

    if (!session || session.expiresAt < new Date()) {
      session = await this.prisma.channelSession.create({
        data: {
          tenantId: tenant.id,
          channel: "ussd",
          phoneNumber: dto.phoneNumber,
          locale,
          journeyId: null,
          currentStepId: HOME_STEP,
          answersJson: "{}",
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      });

      return {
        sessionId: session.id,
        continue: true,
        message: this.homePrompt(locale),
        stepId: HOME_STEP,
      };
    }

    const answers = JSON.parse(session.answersJson) as Record<string, string>;
    const input = (dto.input ?? "").trim();

    if (!session.journeyId || session.currentStepId === HOME_STEP) {
      return this.handleHome({
        sessionId: session.id,
        input,
        answers,
        locale,
        phoneNumber: dto.phoneNumber,
        tenantId: tenant.id,
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
    };
  }

  private homePrompt(locale: LocaleCode): string {
    if (locale === "en") {
      return "Allô Services Togo\n1. Birth certificate\n2. Appointment\n3. Bill payment\n0. Agent";
    }
    if (locale === "ee") {
      return "Allô Services Togo\n1. Dzidzɔ ŋkɔ ŋuti agbalẽ\n2. Gbeƒãɖeɖe\n3. Akɔnta gaƒoƒo\n0. Ame";
    }
    return "Allô Services Togo\n1. Acte de naissance\n2. Rendez-vous\n3. Paiement facture\n0. Agent";
  }

  private async handleHome(params: {
    sessionId: string;
    input: string;
    answers: Record<string, string>;
    locale: LocaleCode;
    phoneNumber: string;
    tenantId: string;
  }) {
    const { sessionId, input, answers, locale, phoneNumber, tenantId } = params;

    if (!input) {
      return {
        sessionId,
        continue: true,
        message: this.homePrompt(locale),
        stepId: HOME_STEP,
      };
    }

    if (input === "0") {
      await this.prisma.channelSession.update({
        where: { id: sessionId },
        data: {
          currentStepId: "end_agent",
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      });
      return {
        sessionId,
        continue: false,
        message:
          locale === "en"
            ? "An agent will call you shortly."
            : "Un agent vous rappellera sous peu.",
        stepId: "end_agent",
      };
    }

    const service = SERVICE_CATALOG[input];
    if (!service) {
      return {
        sessionId,
        continue: true,
        message:
          (locale === "en" ? "Invalid choice.\n" : "Choix invalide.\n") +
          this.homePrompt(locale),
        stepId: HOME_STEP,
      };
    }

    const journey = this.journeys.get(service.journeyId, tenantId);
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
  }): Promise<{
    stepId: string;
    answers: Record<string, string>;
    continue: boolean;
    message: string;
    caseId?: string;
    trackingNumber?: string;
  }> {
    const { journey, step, input, answers, locale, phoneNumber, tenantId } =
      params;

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
        channel: "ussd",
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
