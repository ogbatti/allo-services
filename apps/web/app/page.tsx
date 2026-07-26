"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CaseDetails,
  ConnectorSelection,
  TenantSummary,
  getCase,
  getTenantConnectors,
  listNotifications,
  listTenants,
  ussdStep,
  type UssdResponse,
} from "@/lib/api";

type Locale = "fr" | "ee" | "en";

const TENANT_META: Record<
  string,
  { phone: string; hint: Record<Locale, string>; ledeExtra: Record<"fr" | "en", string> }
> = {
  tg: {
    phone: "+22890000001",
    hint: {
      fr: "Menu: 1 acte · 2 RDV · 3 facture",
      ee: "Menu: 1 agbalẽ · 2 RDV · 3 akɔnta",
      en: "Menu: 1 birth cert · 2 appointment · 3 bill",
    },
    ledeExtra: {
      fr: "Pack complet (état civil, RDV, factures).",
      en: "Full pack (civil status, appointments, bills).",
    },
  },
  bj: {
    phone: "+22990000001",
    hint: {
      fr: "Menu: 1 acte · 2 RDV (pas de factures)",
      ee: "Menu: 1 agbalẽ · 2 RDV",
      en: "Menu: 1 birth cert · 2 appointment (no bills)",
    },
    ledeExtra: {
      fr: "Pack réduit — modules factures désactivés (paramétrage).",
      en: "Thinner pack — bill modules off (configuration).",
    },
  },
};

const copy = {
  fr: {
    brand: "Allô Services",
    lede: "Démo multi-tenant — parcours configurables, paiement et SMS simulés.",
    ussdTitle: "Simulateur USSD",
    trackTitle: "Suivi de dossier",
    smsTitle: "Boîte SMS (simulateur)",
    start: "Composer",
    send: "Envoyer",
    reset: "Nouvelle session",
    track: "Rechercher",
    refreshSms: "Rafraîchir SMS",
    phone: "Numéro",
    input: "Saisie USSD",
    tracking: "N° de suivi",
    tenant: "Pays / tenant",
  },
  ee: {
    brand: "Allô Services",
    lede: "Nɔnɔmetɔ — dukɔwo ƒe nɔnɔmetɔwo, gaƒoƒo kple SMS.",
    ussdTitle: "USSD simule",
    trackTitle: "Nutome dzodzro",
    smsTitle: "SMS ƒe agba (simule)",
    start: "Ŋlɔ",
    send: "Ɖo",
    reset: "Gbugbɔ dze egɔme",
    track: "Di",
    refreshSms: "Yɔ SMS",
    phone: "Ka ƒe xexlẽdzesi",
    input: "USSD ŋɔŋlɔ",
    tracking: "Dzodzro xexlẽdzesi",
    tenant: "Dukɔ",
  },
  en: {
    brand: "Allô Services",
    lede: "Multi-tenant demo — configurable journeys, simulated payment and SMS.",
    ussdTitle: "USSD simulator",
    trackTitle: "Case tracking",
    smsTitle: "SMS outbox (simulator)",
    start: "Dial",
    send: "Send",
    reset: "New session",
    track: "Look up",
    refreshSms: "Refresh SMS",
    phone: "Phone number",
    input: "USSD input",
    tracking: "Tracking number",
    tenant: "Country / tenant",
  },
} as const;

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>("fr");
  const t = copy[locale];
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [tenantId, setTenantId] = useState("tg");
  const [connectors, setConnectors] = useState<ConnectorSelection | null>(null);

  const tenant = tenants.find((x) => x.id === tenantId);
  const meta = TENANT_META[tenantId] ?? TENANT_META.tg;
  const locales = (tenant?.supportedLocales ?? ["fr", "en"]) as Locale[];

  const [phoneNumber, setPhoneNumber] = useState(meta.phone);
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

  useEffect(() => {
    listTenants()
      .then((rows) => setTenants(rows.sort((a, b) => a.id.localeCompare(b.id))))
      .catch(() =>
        setTenants([
          {
            id: "tg",
            countryCode: "TG",
            name: { fr: "Togo", en: "Togo" },
            defaultLocale: "fr",
            supportedLocales: ["fr", "ee", "en"],
            ussdShortCode: "*855#",
            modules: [],
          },
        ]),
      );
  }, []);

  useEffect(() => {
    setPhoneNumber(meta.phone);
    setSessionId(undefined);
    setScreen("…");
    setInput("");
    setCaseDetails(null);
    setTrackingNumber("");
    setSms([]);
    setConnectors(null);
    if (!locales.includes(locale)) setLocale("fr");
    getTenantConnectors(tenantId)
      .then(setConnectors)
      .catch(() => setConnectors(null));
  }, [tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSend = useMemo(
    () => Boolean(sessionId) && input.trim().length > 0 && !busy,
    [sessionId, input, busy],
  );

  const ussdLabel = tenant?.ussdShortCode ?? "*855#";
  const countryName =
    tenant?.name[locale] ?? tenant?.name.fr ?? tenantId.toUpperCase();

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
        tenantId,
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
        tenantId,
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
    const rows = await listNotifications(tenantId);
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

      <p className="tag">
        Tenant {tenantId.toUpperCase()} · Apache-2.0 · MVP
      </p>
      <h1 className="brand">{t.brand}</h1>
      <p className="lede">
        {t.lede}{" "}
        {locale === "en" ? meta.ledeExtra.en : meta.ledeExtra.fr}
      </p>
      <p className="meta" style={{ marginTop: "-1rem", marginBottom: "1.25rem" }}>
        <Link href="/backoffice">Back-office instructeur →</Link>
      </p>

      <div className="row" style={{ marginBottom: "1rem" }}>
        <label className="meta" htmlFor="tenant">
          {t.tenant}
        </label>
        <select
          id="tenant"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          aria-label={t.tenant}
        >
          {(tenants.length ? tenants : [{ id: "tg", name: { fr: "Togo" } }]).map(
            (row) => (
              <option key={row.id} value={row.id}>
                {row.id.toUpperCase()} — {row.name.fr}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="langs" role="group" aria-label="Language">
        {locales.map((code) => (
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
          <h2>
            {t.ussdTitle} ({ussdLabel})
          </h2>
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
              {t.start} {ussdLabel}
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
            {countryName} · Session: {sessionId ?? "—"} · {meta.hint[locale]}
          </p>
          {tenant && tenant.modules.length > 0 ? (
            <p className="meta">
              Modules:{" "}
              {tenant.modules
                .filter((m) => m.startsWith("service-pack-"))
                .map((m) => m.replace("service-pack-", ""))
                .join(", ") || "—"}
            </p>
          ) : null}
          {connectors ? (
            <p className="meta">
              Connecteurs: paiement={connectors.payment.id} · SMS=
              {connectors.sms.id}
            </p>
          ) : null}
        </section>

        <section className="panel">
          <h2>{t.trackTitle}</h2>
          <form className="row" onSubmit={lookupCase}>
            <input
              aria-label={t.tracking}
              placeholder={`${tenant?.countryCode ?? "TG"}…`}
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
                  {caseDetails.serviceCode} · {caseDetails.status} ·{" "}
                  {caseDetails.feeAmount} {caseDetails.feeCurrency}
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
          <button type="button" className="secondary" onClick={() => void refreshSms()}>
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
