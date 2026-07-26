/** UI copy for service-specific instruction (mirrors @allo/shared packs). */

export type ServicePackUi = {
  label: string;
  instructHint: string;
  noteHint: string;
  actionLabels: Record<string, string>;
  statusLabels: Record<string, string>;
};

const DEFAULT_ACTIONS: Record<string, string> = {
  ready: "Marquer prêt",
  incomplete: "Demander complément",
  rejected: "Rejeter",
  delivered: "Marquer remis",
  closed: "Clôturer",
  in_review: "Reprendre instruction",
};

const DEFAULT_STATUS: Record<string, string> = {
  in_review: "En instruction",
  incomplete: "Incomplet",
  ready: "Prêt",
  delivered: "Remis",
  rejected: "Rejeté",
  awaiting_payment: "Attente paiement",
  closed: "Clos",
  cancelled: "Annulé",
};

const PACKS: Record<string, ServicePackUi> = {
  ETC_ACTE_NAISSANCE: {
    label: "État civil",
    instructHint:
      "Vérifiez l'identité et les pièces, puis marquez l'acte prêt au retrait.",
    noteHint: "Ex. photo d'identité illisible, date de naissance incorrecte",
    actionLabels: {
      ...DEFAULT_ACTIONS,
      ready: "Acte prêt",
      incomplete: "Demander pièce",
      rejected: "Rejeter demande",
      delivered: "Acte remis",
    },
    statusLabels: {
      ...DEFAULT_STATUS,
      ready: "Acte prêt",
      delivered: "Acte remis",
    },
  },
  RDV_SANTE: {
    label: "Rendez-vous",
    instructHint:
      "Confirmez le créneau ou proposez une autre date à l'usager.",
    noteHint: "Ex. créneau complet — proposer 14/08 matin",
    actionLabels: {
      ...DEFAULT_ACTIONS,
      ready: "Confirmer RDV",
      incomplete: "Proposer autre créneau",
      rejected: "Annuler / refuser",
      delivered: "Passage effectué",
    },
    statusLabels: {
      ...DEFAULT_STATUS,
      in_review: "À confirmer",
      ready: "RDV confirmé",
      delivered: "Passage effectué",
    },
  },
  PAY_FACTURE: {
    label: "Factures",
    instructHint:
      "Contrôlez la référence et le paiement, puis validez le reçu.",
    noteHint: "Ex. référence client introuvable, montant incohérent",
    actionLabels: {
      ...DEFAULT_ACTIONS,
      ready: "Valider reçu",
      incomplete: "Demander correction",
      rejected: "Invalider paiement",
      delivered: "Reçu envoyé",
    },
    statusLabels: {
      ...DEFAULT_STATUS,
      in_review: "À contrôler",
      ready: "Paiement validé",
      delivered: "Reçu envoyé",
    },
  },
};

export function getServicePackUi(serviceCode: string): ServicePackUi {
  return (
    PACKS[serviceCode] ?? {
      label: serviceCode,
      instructHint: "Instruez ce dossier selon la procédure locale.",
      noteHint: "Note / motif",
      actionLabels: DEFAULT_ACTIONS,
      statusLabels: DEFAULT_STATUS,
    }
  );
}

export function statusLabel(serviceCode: string, status: string): string {
  const pack = getServicePackUi(serviceCode);
  return pack.statusLabels[status] ?? DEFAULT_STATUS[status] ?? status;
}

export function actionLabel(serviceCode: string, status: string): string {
  const pack = getServicePackUi(serviceCode);
  return pack.actionLabels[status] ?? DEFAULT_ACTIONS[status] ?? status;
}

export const SERVICE_OPTIONS = [
  { code: "ETC_ACTE_NAISSANCE", label: "État civil" },
  { code: "RDV_SANTE", label: "Rendez-vous" },
  { code: "PAY_FACTURE", label: "Factures" },
] as const;
