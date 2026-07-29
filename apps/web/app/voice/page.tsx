"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CaseDetails,
  TenantSummary,
  getCase,
  listTenants,
  voiceStep,
  type ChannelResponse,
} from "@/lib/api";

export default function VoicePage() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [tenantId, setTenantId] = useState("tg");
  const [phoneNumber, setPhoneNumber] = useState("+22890000033");
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
    setPhoneNumber(
      tenantId === "bj"
        ? "+22990000033"
        : tenantId === "sn"
          ? "+22170000033"
          : "+22890000033",
    );
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
      await apply(await voiceStep({ tenantId, phoneNumber, locale }));
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
        await voiceStep({
          tenantId,
          phoneNumber,
          sessionId,
          input: input.trim(),
          locale,
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

      <p className="tag">Canal voix · stub IVR</p>
      <h1 className="brand">Serveur vocal</h1>
      <p className="lede">
        Simulation DTMF : l&apos;usager compose le numéro court du tenant. Mêmes
        parcours, canal <code>voice</code> — prêt pour Asterisk / Twilio.
      </p>

      <div className="row" style={{ marginBottom: "1rem", flexWrap: "wrap" }}>
        <Link href="/" className="meta">
          ← Citoyen
        </Link>
        <Link href="/whatsapp" className="meta">
          WhatsApp
        </Link>
        <Link href="/agent" className="meta">
          Agent
        </Link>
        <Link href="/backoffice" className="meta">
          Back-office
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
          <h2>IVR simulé</h2>
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

          <label className="meta" htmlFor="phone">
            Numéro de l&apos;appelant
          </label>
          <div className="row">
            <input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button type="button" onClick={() => void startSession()} disabled={busy}>
              Décrocher
            </button>
            <button type="button" className="secondary" onClick={reset} disabled={busy}>
              Raccrocher
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
              aria-label="Touche DTMF"
              placeholder="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!sessionId || busy}
            />
            <button type="submit" disabled={!canSend}>
              Composer
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
            <p className="meta">Aucun dossier pour l&apos;instant.</p>
          )}
        </section>
      </div>
    </main>
  );
}
