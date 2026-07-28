"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CaseDetails,
  CaseSummary,
  Instructor,
  StaffMember,
  TenantSummary,
  allowedTransitionsFor,
  getCase,
  getToken,
  instructCase,
  listCases,
  listInbox,
  listStaff,
  listTenants,
  loginInstructor,
  meInstructor,
  setStaffActive,
  setToken,
} from "@/lib/api";
import {
  SERVICE_OPTIONS,
  actionLabel,
  getServicePackUi,
  statusLabel,
} from "@/lib/service-packs";
import { isSupervisorPlus, isTenantAdmin, roleLabel } from "@/lib/roles";

type Filter = "inbox" | "all" | "ready" | "rejected";

const FALLBACK_EMAILS: Record<string, string> = {
  tg: "instructeur@lome.tg",
  bj: "instructeur@cotonou.bj",
  sn: "instructeur@sn.demo",
};

export default function BackofficePage() {
  const [authReady, setAuthReady] = useState(false);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [tenantId, setTenantId] = useState("tg");
  const [email, setEmail] = useState(FALLBACK_EMAILS.tg);
  const [password, setPassword] = useState("Demo2026!");
  const [filter, setFilter] = useState<Filter>("inbox");
  const [serviceCode, setServiceCode] = useState("");
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selected, setSelected] = useState<CaseDetails | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const selectedPack = useMemo(
    () => (selected ? getServicePackUi(selected.serviceCode) : null),
    [selected],
  );

  const serviceFilterOptions = useMemo(() => {
    const tenant = tenants.find((t) => t.id === (instructor?.tenantId ?? tenantId));
    const modules = tenant?.modules ?? [];
    return SERVICE_OPTIONS.filter((s) => {
      if (s.code === "PAY_FACTURE") {
        return modules.length === 0 || modules.includes("service-pack-bill-payment");
      }
      if (s.code === "RDV_SANTE") {
        return modules.length === 0 || modules.includes("service-pack-appointments");
      }
      return true;
    });
  }, [tenantId, tenants, instructor]);

  useEffect(() => {
    listTenants()
      .then((rows) => setTenants(rows.sort((a, b) => a.id.localeCompare(b.id))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthReady(true);
      return;
    }
    meInstructor()
      .then((user) => {
        setInstructor(user);
        setTenantId(user.tenantId);
      })
      .catch(() => setToken(null))
      .finally(() => setAuthReady(true));
  }, []);

  const refresh = useCallback(async () => {
    if (!instructor) return;
    const tid = instructor.tenantId;
    setBusy(true);
    setError(null);
    try {
      const rows =
        filter === "inbox"
          ? await listInbox(tid)
          : filter === "all"
            ? await listCases(tid, undefined, serviceCode || undefined)
            : await listCases(tid, filter, serviceCode || undefined);
      const filtered =
        filter === "inbox" && serviceCode
          ? rows.filter((r) => r.serviceCode === serviceCode)
          : rows;
      setCases(filtered);
      if (isSupervisorPlus(instructor.role)) {
        try {
          setStaff(await listStaff());
        } catch {
          setStaff([]);
        }
      } else {
        setStaff([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setBusy(false);
    }
  }, [filter, instructor, serviceCode]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function onTenantPick(id: string) {
    setTenantId(id);
    setEmail(FALLBACK_EMAILS[id] ?? `instructeur@${id}.demo`);
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await loginInstructor({
        tenantId,
        email,
        password,
      });
      setToken(res.accessToken);
      setInstructor(res.instructor);
      setTenantId(res.instructor.tenantId);
      setOk(`Connecté: ${res.instructor.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setToken(null);
    setInstructor(null);
    setCases([]);
    setSelected(null);
  }

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

  async function runAction(toStatus: string) {
    if (!selected || !instructor) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const updated = await instructCase(selected.trackingNumber, {
        toStatus,
        note: note.trim() || undefined,
      });
      setSelected(updated);
      setOk(
        `Statut mis à jour → ${statusLabel(updated.serviceCode, toStatus)}`,
      );
      setNote("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStaff(member: StaffMember) {
    if (!instructor || !isTenantAdmin(instructor.role)) return;
    setBusy(true);
    setError(null);
    try {
      await setStaffActive(member.id, !member.active);
      setOk(
        `${member.email} ${member.active ? "désactivé" : "réactivé"}`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  if (!authReady) {
    return (
      <main className="shell">
        <p className="meta">Chargement…</p>
      </main>
    );
  }

  if (!instructor) {
    return (
      <main className="shell">
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Source+Sans+3:wght@400;600;700&display=swap"
        />
        <p className="tag">Back-office · Authentification</p>
        <h1 className="brand">Connexion instructeur</h1>
        <p className="lede">
          Accès réservé aux agents des communes et administrations partenaires.
        </p>
        <p className="meta" style={{ marginBottom: "1rem" }}>
          <Link href="/">← Démo citoyen</Link>
        </p>
        <form className="panel" onSubmit={onLogin} style={{ maxWidth: 420 }}>
          <label className="meta" htmlFor="tenant">
            Tenant
          </label>
          <select
            id="tenant"
            value={tenantId}
            onChange={(e) => onTenantPick(e.target.value)}
            style={{ width: "100%", margin: "0.4rem 0 0.85rem" }}
          >
            {(tenants.length
              ? tenants
              : [
                  { id: "tg", name: { fr: "Togo" } },
                  { id: "bj", name: { fr: "Bénin" } },
                ]
            ).map((t) => (
              <option key={t.id} value={t.id}>
                {t.id.toUpperCase()} — {t.name.fr}
              </option>
            ))}
          </select>
          <label className="meta" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", margin: "0.4rem 0 0.85rem" }}
          />
          <label className="meta" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", margin: "0.4rem 0 0.85rem" }}
          />
          {error ? (
            <p className="meta" style={{ color: "var(--warn)" }}>
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={busy}>
            Se connecter
          </button>
          <p className="meta" style={{ marginTop: "0.85rem" }}>
            TG: instructeur@ / superviseur@ / admin@lome.tg · BJ/SN: instructeur@
            ou admin@ · mot de passe Demo2026!
          </p>
        </form>
      </main>
    );
  }

  return (
    <main className="shell">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Source+Sans+3:wght@400;600;700&display=swap"
      />

      <p className="tag">
        Back-office · Tenant {instructor.tenantId.toUpperCase()} ·{" "}
        {roleLabel(instructor.role)}
      </p>
      <h1 className="brand">Instruction des dossiers</h1>
      <p className="lede">
        Actions et SMS adaptés au type de service. Les transitions dépendent de
        votre rôle ({roleLabel(instructor.role)}).
      </p>

      <div className="row" style={{ marginBottom: "1rem" }}>
        <Link href="/" className="meta">
          ← Démo citoyen
        </Link>
        <Link href="/agent" className="meta">
          Agent
        </Link>
        <Link href="/dashboard" className="meta">
          Dashboard
        </Link>
        <span className="meta">
          {instructor.name} · {instructor.email} · {roleLabel(instructor.role)}
        </span>
        <button type="button" className="secondary" onClick={logout}>
          Déconnexion
        </button>
      </div>

      <div className="row">
        <button
          type="button"
          className="secondary"
          onClick={() => void refresh()}
          disabled={busy}
        >
          Rafraîchir
        </button>
        <select
          aria-label="Service"
          value={serviceCode}
          onChange={(e) => setServiceCode(e.target.value)}
        >
          <option value="">Tous services</option>
          {serviceFilterOptions.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className="langs"
        role="group"
        aria-label="Filtre"
        style={{ marginTop: "1rem" }}
      >
        {(
          [
            ["inbox", "À instruire"],
            ["all", "Tous"],
            ["ready", "Prêts / confirmés"],
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
          <h2>File ({cases.length})</h2>
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
                    {statusLabel(c.serviceCode, c.status)} ·{" "}
                    {getServicePackUi(c.serviceCode).label}
                  </span>
                  <span className="meta">{c.phoneNumber}</span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Dossier</h2>
          {!selected || !selectedPack ? (
            <p className="meta">Sélectionnez un dossier à gauche.</p>
          ) : (
            <>
              <div className="item">
                <strong>{selected.trackingNumber}</strong>
                <span className="meta">
                  {statusLabel(selected.serviceCode, selected.status)} ·{" "}
                  {selectedPack.label}
                </span>
                <span className="meta">
                  {selected.phoneNumber} · {selected.channel} ·{" "}
                  {selected.feeAmount} {selected.feeCurrency}
                </span>
                <p className="meta" style={{ marginTop: "0.5rem" }}>
                  {selectedPack.instructHint}
                </p>
                <pre className="meta" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>

              <label
                className="meta"
                htmlFor="note"
                style={{ display: "block", marginTop: "0.85rem" }}
              >
                Note / motif (obligatoire pour rejet ou complément)
              </label>
              <textarea
                id="note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={selectedPack.noteHint}
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
                    disabled={busy}
                    onClick={() => void runAction(status)}
                    className={status === "rejected" ? "secondary" : undefined}
                  >
                    {actionLabel(selected.serviceCode, status)}
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

      {isSupervisorPlus(instructor.role) ? (
        <section className="panel" style={{ marginTop: "1.25rem" }}>
          <h2>Équipe ({staff.length})</h2>
          <p className="meta">
            Visible pour superviseur / admin. Seul l&apos;admin peut activer ou
            désactiver un compte.
          </p>
          <div className="list">
            {staff.length === 0 ? (
              <p className="meta">Aucun agent chargé.</p>
            ) : (
              staff.map((m) => (
                <div className="item" key={m.id}>
                  <strong>
                    {m.name} · {roleLabel(m.role)}
                  </strong>
                  <span className="meta">
                    {m.email} · {m.active ? "actif" : "inactif"}
                  </span>
                  {isTenantAdmin(instructor.role) &&
                  m.email !== instructor.email ? (
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy}
                      onClick={() => void toggleStaff(m)}
                      style={{ marginTop: "0.4rem" }}
                    >
                      {m.active ? "Désactiver" : "Réactiver"}
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
