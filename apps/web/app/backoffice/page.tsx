"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  CaseDetails,
  CaseSummary,
  allowedTransitionsFor,
  getCase,
  instructCase,
  listInbox,
  listCases,
} from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  in_review: "En instruction",
  incomplete: "Incomplet",
  ready: "Prêt",
  delivered: "Remis",
  rejected: "Rejeté",
  awaiting_payment: "Attente paiement",
  closed: "Clos",
  cancelled: "Annulé",
};

const ACTION_LABELS: Record<string, string> = {
  ready: "Marquer prêt",
  incomplete: "Demander complément",
  rejected: "Rejeter",
  delivered: "Marquer remis",
  closed: "Clôturer",
  in_review: "Reprendre instruction",
};

type Filter = "inbox" | "all" | "ready" | "rejected";

export default function BackofficePage() {
  const [filter, setFilter] = useState<Filter>("inbox");
  const [actor, setActor] = useState("Agent Commune Lomé");
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selected, setSelected] = useState<CaseDetails | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const rows =
        filter === "inbox"
          ? await listInbox("tg")
          : filter === "all"
            ? await listCases("tg")
            : await listCases("tg", filter);
      setCases(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setBusy(false);
    }
  }, [filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function openCase(trackingNumber: string) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const details = await getCase(trackingNumber);
      setSelected(details);
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(toStatus: string, e?: FormEvent) {
    e?.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const updated = await instructCase(selected.trackingNumber, {
        toStatus,
        actor,
        note: note.trim() || undefined,
      });
      setSelected(updated);
      setOk(`Statut mis à jour → ${STATUS_LABELS[toStatus] ?? toStatus}`);
      setNote("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Source+Sans+3:wght@400;600;700&display=swap"
      />

      <p className="tag">Back-office · Tenant TG · Démo</p>
      <h1 className="brand">Instruction des dossiers</h1>
      <p className="lede">
        File d&apos;attente des demandes d&apos;acte de naissance. Validez,
        demandez un complément ou rejetez — un SMS est envoyé à l&apos;usager.
      </p>

      <div className="row" style={{ marginBottom: "1rem" }}>
        <Link href="/" className="meta">
          ← Démo citoyen
        </Link>
      </div>

      <label className="meta" htmlFor="actor">
        Instructeur
      </label>
      <div className="row">
        <input
          id="actor"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
        />
        <button type="button" className="secondary" onClick={() => void refresh()} disabled={busy}>
          Rafraîchir
        </button>
      </div>

      <div className="langs" role="group" aria-label="Filtre" style={{ marginTop: "1rem" }}>
        {(
          [
            ["inbox", "À instruire"],
            ["all", "Tous"],
            ["ready", "Prêts"],
            ["rejected", "Rejetés"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="secondary"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="meta" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      ) : null}
      {ok ? <p className="meta" style={{ color: "#b7ebcf" }}>{ok}</p> : null}

      <div className="grid" style={{ marginTop: "1rem" }}>
        <section className="panel">
          <h2>
            File ({cases.length})
          </h2>
          <div className="list">
            {cases.length === 0 ? (
              <p className="meta">Aucun dossier dans ce filtre.</p>
            ) : (
              cases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="item"
                  style={{
                    textAlign: "left",
                    width: "100%",
                    cursor: "pointer",
                    borderColor:
                      selected?.id === c.id ? "var(--accent)" : undefined,
                  }}
                  onClick={() => void openCase(c.trackingNumber)}
                >
                  <strong>{c.trackingNumber}</strong>
                  <span className="meta">
                    {STATUS_LABELS[c.status] ?? c.status} · {c.phoneNumber}
                  </span>
                  {c.payload?.childFullName ? (
                    <span className="meta">{c.payload.childFullName}</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Dossier</h2>
          {!selected ? (
            <p className="meta">Sélectionnez un dossier à gauche.</p>
          ) : (
            <>
              <div className="item">
                <strong>{selected.trackingNumber}</strong>
                <span className="meta">
                  {STATUS_LABELS[selected.status] ?? selected.status} ·{" "}
                  {selected.serviceCode}
                </span>
                <span className="meta">
                  {selected.phoneNumber} · {selected.channel} ·{" "}
                  {selected.feeAmount} {selected.feeCurrency}
                </span>
                <pre className="meta" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>

              <label className="meta" htmlFor="note" style={{ display: "block", marginTop: "0.85rem" }}>
                Note / motif (obligatoire pour rejet ou complément)
              </label>
              <textarea
                id="note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex. photo d'identité illisible"
                style={{ width: "100%", marginTop: "0.4rem" }}
              />

              <div className="row" style={{ marginTop: "0.85rem" }}>
                {(selected.allowedTransitions?.length
                  ? selected.allowedTransitions
                  : allowedTransitionsFor(selected.status)
                ).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={busy || !actor.trim()}
                    onClick={() => void runAction(status)}
                    className={
                      status === "rejected" ? "secondary" : undefined
                    }
                  >
                    {ACTION_LABELS[status] ?? status}
                  </button>
                ))}
              </div>

              {selected.events && selected.events.length > 0 ? (
                <div className="list" style={{ marginTop: "1rem" }}>
                  <h2 style={{ fontSize: "1.1rem" }}>Historique</h2>
                  {selected.events.map((ev) => (
                    <div className="item" key={ev.id}>
                      <strong>
                        {ev.fromStatus ?? "—"} → {ev.toStatus}
                      </strong>
                      <span className="meta">
                        {ev.actor}
                        {ev.note ? ` · ${ev.note}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
