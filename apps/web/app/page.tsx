"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  CaseDetails,
  getCase,
  listNotifications,
  ussdStep,
  type UssdResponse,
} from "@/lib/api";

type Locale = "fr" | "ee" | "en";

const copy = {
  fr: {
    brand: "Allô Services",
    lede: "Démo bout-en-bout — demande d'acte de naissance (Togo), paiement simulé et SMS.",
    ussdTitle: "Simulateur USSD (*855#)",
    trackTitle: "Suivi de dossier",
    smsTitle: "Boîte SMS (simulateur)",
    start: "Composer *855#",
    send: "Envoyer",
    reset: "Nouvelle session",
    track: "Rechercher",
    refreshSms: "Rafraîchir SMS",
    phone: "Numéro",
    input: "Saisie USSD",
    tracking: "N° de suivi",
  },
  ee: {
    brand: "Allô Services",
    lede: "Nɔnɔmetɔ — dzidzɔ ŋkɔ ŋuti agbalẽ biabia (Togo), gaƒoƒo kple SMS.",
    ussdTitle: "USSD simule (*855#)",
    trackTitle: "Nutome dzodzro",
    smsTitle: "SMS ƒe agba (simule)",
    start: "Ŋlɔ *855#",
    send: "Ɖo",
    reset: "Gbugbɔ dze egɔme",
    track: "Di",
    refreshSms: "Yɔ SMS",
    phone: "Ka ƒe xexlẽdzesi",
    input: "USSD ŋɔŋlɔ",
    tracking: "Dzodzro xexlẽdzesi",
  },
  en: {
    brand: "Allô Services",
    lede: "End-to-end demo — birth certificate request (Togo), simulated payment and SMS.",
    ussdTitle: "USSD simulator (*855#)",
    trackTitle: "Case tracking",
    smsTitle: "SMS outbox (simulator)",
    start: "Dial *855#",
    send: "Send",
    reset: "New session",
    track: "Look up",
    refreshSms: "Refresh SMS",
    phone: "Phone number",
    input: "USSD input",
    tracking: "Tracking number",
  },
} as const;

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const t = copy[locale];

  const [phoneNumber, setPhoneNumber] = useState("+22890000001");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [screen, setScreen] = useState("…");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [sms, setSms] = useState<
    Array<{ id: string; recipient: string; body: string; createdAt: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(
    () => Boolean(sessionId) && input.trim().length > 0 && !busy,
    [sessionId, input, busy],
  );

  async function applyUssd(res: UssdResponse) {
    setSessionId(res.sessionId);
    setScreen(res.message);
    if (res.trackingNumber) {
      setTrackingNumber(res.trackingNumber);
      const details = await getCase(res.trackingNumber);
      setCaseDetails(details);
      await refreshSms();
    }
  }

  async function startSession() {
    setBusy(true);
    setError(null);
    try {
      const res = await ussdStep({
        tenantId: "tg",
        phoneNumber,
        locale,
      });
      setInput("");
      await applyUssd(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
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
      const res = await ussdStep({
        tenantId: "tg",
        phoneNumber,
        sessionId,
        input: input.trim(),
        locale,
      });
      setInput("");
      await applyUssd(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function lookupCase(e?: FormEvent) {
    e?.preventDefault();
    if (!trackingNumber.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const details = await getCase(trackingNumber.trim());
      setCaseDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function refreshSms() {
    const rows = await listNotifications("tg");
    setSms(rows);
  }

  function resetSession() {
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

      <p className="tag">Tenant TG · Apache-2.0 · MVP</p>
      <h1 className="brand">{t.brand}</h1>
      <p className="lede">{t.lede}</p>
      <p className="meta" style={{ marginTop: "-1rem", marginBottom: "1.25rem" }}>
        <Link href="/backoffice">Back-office instructeur →</Link>
      </p>

      <div className="langs" role="group" aria-label="Language">
        {(["fr", "ee", "en"] as Locale[]).map((code) => (
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

      {error ? (
        <p className="meta" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      ) : null}

      <div className="grid">
        <section className="panel">
          <h2>{t.ussdTitle}</h2>
          <label className="meta" htmlFor="phone">
            {t.phone}
          </label>
          <div className="row">
            <input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button type="button" onClick={startSession} disabled={busy}>
              {t.start}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={resetSession}
              disabled={busy}
            >
              {t.reset}
            </button>
          </div>

          <div className="phone" aria-live="polite">
            {screen}
          </div>

          <form className="row" onSubmit={sendInput}>
            <input
              aria-label={t.input}
              placeholder="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!sessionId || busy}
            />
            <button type="submit" disabled={!canSend}>
              {t.send}
            </button>
          </form>
          <p className="meta">
            Session: {sessionId ?? "—"} · Hint: 1 → name → date → commune → 1
          </p>
        </section>

        <section className="panel">
          <h2>{t.trackTitle}</h2>
          <form className="row" onSubmit={lookupCase}>
            <input
              aria-label={t.tracking}
              placeholder="TG…"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
            <button type="submit" disabled={busy}>
              {t.track}
            </button>
          </form>

          {caseDetails ? (
            <div className="list">
              <div className="item">
                <strong>{caseDetails.trackingNumber}</strong>
                <span className="meta">
                  {caseDetails.status} · {caseDetails.feeAmount}{" "}
                  {caseDetails.feeCurrency}
                </span>
                <pre className="meta" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(caseDetails.payload, null, 2)}
                </pre>
              </div>
              {caseDetails.payments.map((p) => (
                <div className="item" key={p.id}>
                  <strong>Payment {p.status}</strong>
                  <span className="meta">
                    {p.amount} {p.currency} · {p.externalRef}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="meta">—</p>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: "1.25rem" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>{t.smsTitle}</h2>
          <button type="button" className="secondary" onClick={refreshSms}>
            {t.refreshSms}
          </button>
        </div>
        <div className="list">
          {sms.length === 0 ? (
            <p className="meta">—</p>
          ) : (
            sms.slice(0, 8).map((n) => (
              <div className="item" key={n.id}>
                <strong>{n.recipient}</strong>
                <span className="meta">{n.body}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
