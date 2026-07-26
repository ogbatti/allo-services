/** Local copies to avoid circular imports with index.ts */
type LocaleCode = "fr" | "ee" | "en";
type CaseStatus =
  | "registered"
  | "incomplete"
  | "awaiting_payment"
  | "in_review"
  | "ready"
  | "delivered"
  | "rejected"
  | "closed"
  | "cancelled";
interface LocalizedText {
  fr: string;
  ee?: string;
  en?: string;
}

/** Module flag that enables a service pack on a tenant. */
export const SERVICE_MODULE: Record<string, string> = {
  ETC_ACTE_NAISSANCE: "service-pack-civil-status",
  RDV_SANTE: "service-pack-appointments",
  PAY_FACTURE: "service-pack-bill-payment",
};

export const SERVICE_CODE_ORDER = [
  "ETC_ACTE_NAISSANCE",
  "RDV_SANTE",
  "PAY_FACTURE",
] as const;

export type InstructAction = Extract<
  CaseStatus,
  "ready" | "incomplete" | "rejected" | "delivered" | "closed" | "in_review"
>;

export interface ServicePackDefinition {
  serviceCode: string;
  label: LocalizedText;
  /** Short line shown under the dossier title in back-office */
  instructHint: LocalizedText;
  noteHint: LocalizedText;
  actionLabels: Partial<Record<InstructAction, LocalizedText>>;
  statusLabels: Partial<Record<CaseStatus, LocalizedText>>;
  sms: {
    ready: LocalizedText;
    incomplete: LocalizedText;
    rejected: LocalizedText;
    delivered: LocalizedText;
  };
}

export const SERVICE_PACKS: Record<string, ServicePackDefinition> = {
  ETC_ACTE_NAISSANCE: {
    serviceCode: "ETC_ACTE_NAISSANCE",
    label: {
      fr: "État civil",
      ee: "Dzidzɔ ŋkɔ",
      en: "Civil status",
    },
    instructHint: {
      fr: "Vérifiez l'identité et les pièces, puis marquez l'acte prêt au retrait.",
      en: "Verify identity and documents, then mark the certificate ready for collection.",
      ee: "Kpɔ ŋkɔ kple agbalẽwo, eye nàɖo be woxɔe.",
    },
    noteHint: {
      fr: "Ex. photo d'identité illisible, date de naissance incorrecte",
      en: "e.g. illegible ID photo, wrong date of birth",
      ee: "Kpɔɖeŋu: foto mesɔ o",
    },
    actionLabels: {
      ready: { fr: "Acte prêt", en: "Certificate ready", ee: "Agbalẽ ɖo" },
      incomplete: {
        fr: "Demander pièce",
        en: "Request document",
        ee: "Bia agbalẽ",
      },
      rejected: { fr: "Rejeter demande", en: "Reject request", ee: "Gbe biabia" },
      delivered: { fr: "Acte remis", en: "Certificate delivered", ee: "Wotsɔ agbalẽ" },
      closed: { fr: "Clôturer", en: "Close", ee: "Tu" },
      in_review: {
        fr: "Reprendre instruction",
        en: "Resume review",
        ee: "Gbugbɔ kpɔ",
      },
    },
    statusLabels: {
      ready: { fr: "Acte prêt", en: "Certificate ready", ee: "Agbalẽ ɖo" },
      delivered: { fr: "Acte remis", en: "Delivered", ee: "Wotsɔe" },
    },
    sms: {
      ready: {
        fr: "Allô Services: acte prêt pour {{trackingNumber}}. Retrait agent ou téléchargement selon commune.",
        en: "Allô Services: certificate ready for {{trackingNumber}}. Collect via agent or download when available.",
        ee: "Allô Services: agbalẽ {{trackingNumber}} ɖo. Vá xɔe to ame gbɔ.",
      },
      incomplete: {
        fr: "Allô Services: dossier {{trackingNumber}} incomplet. Manque: {{note}}",
        en: "Allô Services: {{trackingNumber}} incomplete. Missing: {{note}}",
        ee: "Allô Services: {{trackingNumber}} meɖe go o. Susu: {{note}}",
      },
      rejected: {
        fr: "Allô Services: demande {{trackingNumber}} rejetée. Motif: {{note}}",
        en: "Allô Services: request {{trackingNumber}} rejected. Reason: {{note}}",
        ee: "Allô Services: biabia {{trackingNumber}} wogbe. Nukata: {{note}}",
      },
      delivered: {
        fr: "Allô Services: acte {{trackingNumber}} remis.",
        en: "Allô Services: certificate {{trackingNumber}} marked as delivered.",
        ee: "Allô Services: agbalẽ {{trackingNumber}} wotsɔ.",
      },
    },
  },
  RDV_SANTE: {
    serviceCode: "RDV_SANTE",
    label: {
      fr: "Rendez-vous",
      ee: "Gbeƒãɖeɖe",
      en: "Appointment",
    },
    instructHint: {
      fr: "Confirmez le créneau ou proposez une autre date à l'usager.",
      en: "Confirm the slot or propose another date to the citizen.",
      ee: "Ðo kpe ɣeyiɣi alo na bubu.",
    },
    noteHint: {
      fr: "Ex. créneau complet — proposer 14/08 matin",
      en: "e.g. slot full — propose 14/08 morning",
      ee: "Kpɔɖeŋu: ɣeyiɣi meɖe o",
    },
    actionLabels: {
      ready: {
        fr: "Confirmer RDV",
        en: "Confirm appointment",
        ee: "Ðo kpe RDV",
      },
      incomplete: {
        fr: "Proposer autre créneau",
        en: "Propose other slot",
        ee: "Na ɣeyiɣi bubu",
      },
      rejected: {
        fr: "Annuler / refuser",
        en: "Cancel / refuse",
        ee: "Gbe / tɔ",
      },
      delivered: {
        fr: "Passage effectué",
        en: "Attendance done",
        ee: "Vaɖo",
      },
      closed: { fr: "Clôturer", en: "Close", ee: "Tu" },
      in_review: {
        fr: "Reprendre",
        en: "Resume",
        ee: "Gbugbɔ",
      },
    },
    statusLabels: {
      ready: { fr: "RDV confirmé", en: "Appointment confirmed", ee: "RDV ɖo" },
      delivered: {
        fr: "Passage effectué",
        en: "Attended",
        ee: "Vaɖo",
      },
      in_review: {
        fr: "À confirmer",
        en: "To confirm",
        ee: "Nàɖo kpe",
      },
    },
    sms: {
      ready: {
        fr: "Allô Services: RDV confirmé ({{trackingNumber}}). Présentez-vous au créneau choisi. Un rappel SMS suivra.",
        en: "Allô Services: appointment confirmed ({{trackingNumber}}). Please attend the chosen slot.",
        ee: "Allô Services: RDV {{trackingNumber}} ɖo. Vá le ɣeyiɣi si nèɖo.",
      },
      incomplete: {
        fr: "Allô Services: RDV {{trackingNumber}} — créneau à revoir: {{note}}",
        en: "Allô Services: appointment {{trackingNumber}} — please revise slot: {{note}}",
        ee: "Allô Services: RDV {{trackingNumber}} — ɣeyiɣi: {{note}}",
      },
      rejected: {
        fr: "Allô Services: RDV {{trackingNumber}} non confirmé. Motif: {{note}}",
        en: "Allô Services: appointment {{trackingNumber}} not confirmed. Reason: {{note}}",
        ee: "Allô Services: RDV {{trackingNumber}} megava o. Nukata: {{note}}",
      },
      delivered: {
        fr: "Allô Services: passage RDV {{trackingNumber}} enregistré. Merci.",
        en: "Allô Services: attendance for {{trackingNumber}} recorded. Thank you.",
        ee: "Allô Services: RDV {{trackingNumber}} vaɖo. Akpe.",
      },
    },
  },
  PAY_FACTURE: {
    serviceCode: "PAY_FACTURE",
    label: {
      fr: "Factures",
      ee: "Akɔnta",
      en: "Bills",
    },
    instructHint: {
      fr: "Contrôlez la référence et le paiement, puis validez le reçu.",
      en: "Check the reference and payment, then validate the receipt.",
      ee: "Kpɔ asiŋu kple gaƒoƒo, eye nàɖo.",
    },
    noteHint: {
      fr: "Ex. référence client introuvable, montant incohérent",
      en: "e.g. unknown customer reference, amount mismatch",
      ee: "Kpɔɖeŋu: asiŋu mesɔ o",
    },
    actionLabels: {
      ready: {
        fr: "Valider reçu",
        en: "Validate receipt",
        ee: "Ðo kpe xexlẽ",
      },
      incomplete: {
        fr: "Demander correction",
        en: "Request correction",
        ee: "Bia ɖɔɖɔɖɔ",
      },
      rejected: {
        fr: "Invalider paiement",
        en: "Invalidate payment",
        ee: "Gbe gaƒoƒo",
      },
      delivered: {
        fr: "Reçu envoyé",
        en: "Receipt sent",
        ee: "Xexlẽ ɖo",
      },
      closed: { fr: "Clôturer", en: "Close", ee: "Tu" },
      in_review: {
        fr: "Reprendre contrôle",
        en: "Resume check",
        ee: "Gbugbɔ kpɔ",
      },
    },
    statusLabels: {
      ready: {
        fr: "Paiement validé",
        en: "Payment validated",
        ee: "Gaƒoƒo ɖo",
      },
      delivered: {
        fr: "Reçu envoyé",
        en: "Receipt sent",
        ee: "Xexlẽ ɖo",
      },
      in_review: {
        fr: "À contrôler",
        en: "To verify",
        ee: "Nàkpɔ",
      },
    },
    sms: {
      ready: {
        fr: "Allô Services: paiement validé ({{trackingNumber}}). Votre reçu est confirmé.",
        en: "Allô Services: payment validated ({{trackingNumber}}). Your receipt is confirmed.",
        ee: "Allô Services: gaƒoƒo {{trackingNumber}} ɖo. Xexlẽ ɖo.",
      },
      incomplete: {
        fr: "Allô Services: facture {{trackingNumber}} — correction requise: {{note}}",
        en: "Allô Services: bill {{trackingNumber}} — correction needed: {{note}}",
        ee: "Allô Services: akɔnta {{trackingNumber}} — ɖɔɖɔɖɔ: {{note}}",
      },
      rejected: {
        fr: "Allô Services: paiement {{trackingNumber}} invalidé. Motif: {{note}}",
        en: "Allô Services: payment {{trackingNumber}} invalidated. Reason: {{note}}",
        ee: "Allô Services: gaƒoƒo {{trackingNumber}} wogbe. Nukata: {{note}}",
      },
      delivered: {
        fr: "Allô Services: reçu {{trackingNumber}} envoyé. Merci.",
        en: "Allô Services: receipt {{trackingNumber}} sent. Thank you.",
        ee: "Allô Services: xexlẽ {{trackingNumber}} ɖo. Akpe.",
      },
    },
  },
};

const FALLBACK_PACK = SERVICE_PACKS.ETC_ACTE_NAISSANCE;

export function getServicePack(serviceCode: string): ServicePackDefinition {
  return SERVICE_PACKS[serviceCode] ?? FALLBACK_PACK;
}

export function moduleForService(serviceCode: string): string | undefined {
  return SERVICE_MODULE[serviceCode];
}

export function fillTemplate(
  text: string,
  vars: Record<string, string>,
): string {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
}

export function packLabel(
  pack: ServicePackDefinition,
  locale: LocaleCode,
): string {
  return pack.label[locale] ?? pack.label.fr;
}
