"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuditEvent, downloadAuditExport, listAuditEvents } from "@/lib/api";

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [serviceCode, setServiceCode] = useState("");
  const [toStatus, setToStatus] = useState("");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      serviceCode: serviceCode || undefined,
      toStatus: toStatus || undefined,
      actor: actor || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [actor, from, serviceCode, to, toStatus],
  );

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setEvents(await listAuditEvents(filters));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }, [filters]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main className="shell">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Source+Sans+3:wght@400;600;700&display=swap"
      />

      <p className="tag">Gouvernance / traçabilité</p>
      <h1 className="brand">Journal d'audit</h1>
      <p className="lede">
        Export JSON/CSV des transitions de dossiers par tenant, service, statut
        et acteur.
      </p>

      <div className="row" style={{ marginBottom: "1rem", flexWrap: "wrap" }}>
        <Link href="/" className="meta">
          ← Citoyen
        </Link>
        <Link href="/agent" className="meta">
          Agent
        </Link>
        <Link href="/backoffice" className="meta">
          Back-office
        </Link>
        <Link href="/dashboard" className="meta">
          Dashboard
        </Link>
      </div>

      <section className="panel">
        <h2>Filtres</h2>
        <div className="row">
          <select value={serviceCode} onChange={(e) => setServiceCode(e.target.value)}>
            <option value="">Tous services</option>
            <option value="ETC_ACTE_NAISSANCE">Etat civil</option>
            <option value="RDV_SANTE">Rendez-vous</option>
            <option value="PAY_FACTURE">Factures</option>
          </select>
          <select value={toStatus} onChange={(e) => setToStatus(e.target.value)}>
            <option value="">Tous statuts cibles</option>
            <option value="in_review">in_review</option>
            <option value="incomplete">incomplete</option>
            <option value="ready">ready</option>
            <option value="delivered">delivered</option>
            <option value="rejected">rejected</option>
            <option value="closed">closed</option>
          </select>
          <input
            placeholder="acteur contains..."
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button type="button" onClick={() => void refresh()} disabled={busy}>
            Rafraichir
          </button>
        </div>
        <div className="row">
          <button
            type="button"
            className="secondary"
            onClick={() => void downloadAuditExport({ ...filters, format: "csv" })}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => void downloadAuditExport({ ...filters, format: "json" })}
          >
            Export JSON
          </button>
        </div>
      </section>

      {error ? (
        <p className="meta" style={{ color: "var(--warn)", marginTop: "1rem" }}>
          {error}
        </p>
      ) : null}

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h2>Evenements ({events.length})</h2>
        <div className="list">
          {events.length === 0 ? (
            <p className="meta">Aucun evenement.</p>
          ) : (
            events.map((ev) => (
              <div className="item" key={ev.id}>
                <strong>
                  {ev.trackingNumber} - {ev.actor}
                </strong>
                <span className="meta">
                  {new Date(ev.createdAt).toLocaleString()} · {ev.serviceCode} ·{" "}
                  {ev.fromStatus ?? "—"} → {ev.toStatus}
                </span>
                <span className="meta">
                  {ev.channel} · {ev.phoneNumber} · {ev.note ?? "sans note"}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
