"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CaseDetails,
  TenantSummary,
  agentStep,
  getCase,
  listTenants,
  type ChannelResponse,
} from "@/lib/api";

export default function AgentPage() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [tenantId, setTenantId] = useState("tg");
  const [agentName, setAgentName] = useState("Agent Kofi");
  const [phoneNumber, setPhoneNumber] = useState("+22890000011");
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [screen, setScreen] = useState("…");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTenants()
      .then((rows) => setTenants(rows.sort((a, b) => a.id.localeCompare(b.id))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setPhoneNumber(tenantId === "bj" ? "+22990000011" : "+22890000011");
    if (tenantId === "sn") setPhoneNumber("+22170000011");
    setSessionId(undefined);
    setScreen("…");
    setInput("");
    setCaseDetails(null);
    setTrackingNumber("");
  }, [tenantId]);

  const canSend = useMemo(
    () => Boolean(sessionId) && input.trim().length > 0 && !busy,
    [sessionId, input, busy],
  );

  async function apply(res: ChannelResponse) {
    setSessionId(res.sessionId);
    setScreen(res.message);
    if (res.trackingNumber) {
      setTrackingNumber(res.trackingNumber);
      setCaseDetails(await getCase(res.trackingNumber));
    }
  }

  async function startSession() {
    setBusy(true);
    setError(null);
    try {
      await apply(await agentStep({ tenantId, phoneNumber, locale, agentName }));
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function sendInput(e?: FormEvent) {
    e?.preventDefault();
    if (!sessionId || !input.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apply(
        await agentStep({
          tenantId,
          phoneNumber,
          sessionId,
          input: input.trim(),
          locale,
          agentName,
        }),
      );
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setSessionId(undefined);
    setScreen("…");
    setInput("");
    setCaseDetails(null);
    setTrackingNumber("");
  }

  return (
    <main className="shell">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Source+Sans+3:wght@400;600;700&display=swap"
      />

      <p className="tag">Canal agent · Inclusion / dernier kilomètre</p>
      <h1 className="brand">Guichet agent communautaire</h1>
      <p className="lede">
        L'agent saisit le parcours à la place de l'usager. Le dossier est créé
        avec le canal <code>agent</code>.
      </p>

      <div className="row" style={{ marginBottom: "1rem", flexWrap: "wrap" }}>
        <Link href="/" className="meta">
          ← Citoyen
        </Link>
        <Link href="/backoffice" className="meta">
          Back-office
        </Link>
        <Link href="/dashboard" className="meta">
          Tableau de bord
        </Link>
        <Link href="/audit" className="meta">
          Audit
        </Link>
      </div>

      {error ? (
        <p className="meta" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      ) : null}

      <div className="grid">
        <section className="panel">
          <h2>Saisie assistée</h2>
          <label className="meta" htmlFor="tenant">
            Tenant
          </label>
          <select
            id="tenant"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            style={{ width: "100%", margin: "0.35rem 0 0.75rem" }}
          >
            {(tenants.length ? tenants : [{ id: "tg", name: { fr: "Togo" } }]).map(
              (t) => (
                <option key={t.id} value={t.id}>
                  {t.id.toUpperCase()} — {t.name.fr}
                </option>
              ),
            )}
          </select>

          <label className="meta" htmlFor="agentName">
            Nom de l'agent
          </label>
          <input
            id="agentName"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            style={{ width: "100%", margin: "0.35rem 0 0.75rem" }}
          />

          <label className="meta" htmlFor="phone">
            Téléphone de l'usager
          </label>
          <div className="row">
            <input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button type="button" onClick={() => void startSession()} disabled={busy}>
              Démarrer
            </button>
            <button type="button" className="secondary" onClick={reset} disabled={busy}>
              Nouvelle session
            </button>
          </div>

          <div className="langs" style={{ margin: "0.75rem 0" }}>
            {(["fr", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                className="secondary"
                aria-pressed={locale === code}
                onClick={() => setLocale(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="phone" aria-live="polite">
            {screen}
          </div>

          <form className="row" onSubmit={(e) => void sendInput(e)}>
            <input
              aria-label="Réponse"
              placeholder="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!sessionId || busy}
            />
            <button type="submit" disabled={!canSend}>
              Envoyer
            </button>
          </form>
          <p className="meta">Session: {sessionId ?? "—"}</p>
        </section>

        <section className="panel">
          <h2>Dossier créé</h2>
          {caseDetails ? (
            <div className="list">
              <div className="item">
                <strong>{caseDetails.trackingNumber || trackingNumber}</strong>
                <span className="meta">
                  canal={caseDetails.channel} · {caseDetails.serviceCode} ·{" "}
                  {caseDetails.status}
                </span>
                <pre className="meta" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(caseDetails.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="meta">Aucun dossier pour l'instant.</p>
          )}
        </section>
      </div>
    </main>
  );
}
