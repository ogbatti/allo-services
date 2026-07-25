import { Injectable } from "@nestjs/common";
import type { JourneyDefinition, JourneyStep, LocaleCode } from "@allo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { CasesService } from "../cases/cases.service";
import { JourneysService } from "../journeys/journeys.service";
import { PaymentsService } from "../payments/payments.service";
import { TenantsService } from "../tenants/tenants.service";
import { UssdRequestDto } from "./dto";

const DEFAULT_JOURNEY = "civil-status-birth-certificate";
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

  async handle(dto: UssdRequestDto) {
    const tenant = this.tenants.get(dto.tenantId);
    const locale = (dto.locale ?? tenant.defaultLocale) as LocaleCode;
    const journey = this.journeys.get(DEFAULT_JOURNEY, tenant.id);

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
          journeyId: journey.id,
          currentStepId: journey.startStepId,
          answersJson: "{}",
          expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
      });

      const start = this.journeys.getStep(journey, journey.startStepId);
      return {
        sessionId: session.id,
        continue: true,
        message: this.journeys.renderPrompt(start, locale),
        stepId: start.id,
      };
    }

    const answers = JSON.parse(session.answersJson) as Record<string, string>;
    const currentStep = this.journeys.getStep(
      journey,
      session.currentStepId ?? journey.startStepId,
    );

    const next = await this.advance({
      journey,
      step: currentStep,
      input: (dto.input ?? "").trim(),
      answers,
      locale,
      phoneNumber: dto.phoneNumber,
      tenantId: tenant.id,
      sessionId: session.id,
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

  private async advance(params: {
    journey: JourneyDefinition;
    step: JourneyStep;
    input: string;
    answers: Record<string, string>;
    locale: LocaleCode;
    phoneNumber: string;
    tenantId: string;
    sessionId: string;
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

      await this.payments.payByTrackingNumber(created.trackingNumber, {
        phoneNumber: params.phoneNumber,
      });

      params.answers.trackingNumber = created.trackingNumber;
      const end = this.journeys.getStep(params.journey, step.next ?? "end_success");
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
