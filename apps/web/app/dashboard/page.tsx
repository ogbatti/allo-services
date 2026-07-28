"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DemoStats, getDemoStats } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DemoStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setStats(await getDemoStats());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main className="shell">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Source+Sans+3:wght@400;600;700&display=swap"
      />

      <p className="tag">Observabilité démo</p>
      <h1 className="brand">Tableau de bord</h1>
      <p className="lede">
        Volumes dossiers, SMS et paiements par tenant — utile pour une slide
        partenaire en live.
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
        <Link href="/audit" className="meta">
          Audit
        </Link>
        <button
          type="button"
          className="secondary"
          onClick={() => void refresh()}
          disabled={busy}
        >
          Rafraîchir
        </button>
      </div>

      {error ? (
        <p className="meta" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      ) : null}

      {stats ? (
        <>
          <div className="grid" style={{ marginBottom: "1.25rem" }}>
            <section className="panel">
              <h2>Totaux</h2>
              <p className="meta">
                Généré {new Date(stats.generatedAt).toLocaleString()}
              </p>
              <div className="list">
                <div className="item">
                  <strong>{stats.totals.cases}</strong>
                  <span className="meta">Dossiers</span>
                </div>
                <div className="item">
                  <strong>{stats.totals.sms}</strong>
                  <span className="meta">SMS</span>
                </div>
                <div className="item">
                  <strong>{stats.totals.paymentsSucceeded}</strong>
                  <span className="meta">Paiements OK</span>
                </div>
              </div>
            </section>

            <section className="panel">
              <h2>Par tenant</h2>
              <div className="list">
                {stats.tenants.map((t) => (
                  <div className="item" key={t.tenantId}>
                    <strong>
                      {t.tenantId.toUpperCase()} — {t.name.fr}
                    </strong>
                    <span className="meta">
                      {t.casesTotal} dossiers · {t.smsTotal} SMS ·{" "}
                      {t.paymentsSucceeded} paiements
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid">
            {stats.tenants.map((t) => (
              <section className="panel" key={`detail-${t.tenantId}`}>
                <h2>{t.tenantId.toUpperCase()}</h2>
                <p className="meta">Services</p>
                <div className="list">
                  {t.byService.length === 0 ? (
                    <p className="meta">Aucun dossier</p>
                  ) : (
                    t.byService.map((s) => (
                      <div className="item" key={s.serviceCode}>
                        <strong>
                          {s.count} · {s.label}
                        </strong>
                        <span className="meta">{s.serviceCode}</span>
                      </div>
                    ))
                  )}
                </div>
                <p className="meta" style={{ marginTop: "0.85rem" }}>
                  Canaux:{" "}
                  {Object.entries(t.byChannel)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(" · ") || "—"}
                </p>
                <p className="meta">
                  Statuts:{" "}
                  {Object.entries(t.byStatus)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(" · ") || "—"}
                </p>
              </section>
            ))}
          </div>
        </>
      ) : (
        <p className="meta">Chargement…</p>
      )}
    </main>
  );
}
