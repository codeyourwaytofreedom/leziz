import { FormEvent, useState } from "react";
import type { GetServerSideProps } from "next";

import Layout from "@/layout/layout";
import { getSession } from "@/lib/session";
import { useToast } from "@/lib/toast";
import { useI18n } from "@/lib/i18n";

export default function BigBossPage() {
  const toast = useToast();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [languages, setLanguages] = useState("en,de,tr");
  const [defaultLang, setDefaultLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [lastCreated, setLastCreated] = useState<{
    venueId: string;
    token: string;
  } | null>(null);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [createdOwnerEmail, setCreatedOwnerEmail] = useState<string | null>(
    null
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ownerEmail.trim() || !ownerPassword) {
      toast.addToast(t("bigboss.toast.ownerRequired"), "error");
      return;
    }
    if (ownerPassword.length < 6) {
      toast.addToast(t("bigboss.toast.passwordShort"), "error");
      return;
    }
    setLoading(true);
    setLastCreated(null);
    setCreatedOwnerEmail(null);
    try {
      const langs = languages
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const res = await fetch("/api/bigboss/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          languages: langs,
          defaultLang: defaultLang.trim(),
        }),
      });

      if (!res.ok) {
        toast.addToast(t("bigboss.toast.venueError"), "error");
        return;
      }
      const data = (await res.json()) as { venueId: string; token: string };
      setLastCreated(data);
      setName("");
      setDefaultLang("en");
      setOwnerEmail("");
      setOwnerPassword("");
      toast.addToast(t("bigboss.toast.venueSuccess"), "success");

      const userRes = await fetch("/api/bigboss/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ownerEmail.trim(),
          password: ownerPassword,
          venueId: data.venueId,
        }),
      });
      if (!userRes.ok) {
        toast.addToast(t("bigboss.toast.userError"), "error");
      } else {
        setCreatedOwnerEmail(ownerEmail.trim());
        toast.addToast(t("bigboss.toast.userSuccess"), "success");
      }
    } catch {
      toast.addToast(t("bigboss.toast.venueError"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout isLoggedIn showLogin={false} role="bigboss">
      <div style={{ padding: "2rem 0", maxWidth: 520 }}>
        <p style={{ marginBottom: "1.5rem" }}>{t("bigboss.subtitle")}</p>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "0.75rem",
            padding: "1rem",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            background: "var(--color-surface)",
          }}
        >
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>{t("bigboss.venueName")}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                padding: "0.6rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
              }}
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>{t("bigboss.defaultLang")}</span>
            <input
              value={defaultLang}
              onChange={(e) => setDefaultLang(e.target.value)}
              required
              style={{
                padding: "0.6rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
              }}
              placeholder="en"
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>
              {t("bigboss.languagesLabel")}
            </span>
            <input
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              style={{
                padding: "0.6rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
              }}
              placeholder="en,de,tr"
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>{t("bigboss.ownerEmail")}</span>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              style={{
                padding: "0.6rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
              }}
              placeholder="owner@example.com"
            />
          </label>
          <label style={{ display: "grid", gap: "0.35rem" }}>
            <span style={{ fontWeight: 600 }}>
              {t("bigboss.ownerPassword")}
            </span>
            <input
              type="password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              required
              style={{
                padding: "0.6rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
              }}
              placeholder={t("bigboss.ownerPasswordHint")}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.65rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid var(--color-border-strong)",
              background: "var(--color-primary)",
              color: "white",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? t("bigboss.creating") : t("bigboss.createVenue")}
          </button>
        </form>
        {lastCreated && (
          <div style={{ marginTop: "1rem", lineHeight: 1.6 }}>
            <div>
              <strong>Venue ID:</strong> {lastCreated.venueId}
            </div>
            <div>
              <strong>Public token:</strong> {lastCreated.token}
            </div>
            {createdOwnerEmail && (
              <div>
                <strong>Owner user:</strong> {createdOwnerEmail}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = getSession(ctx.req);
  if (!session || session.role !== "bigboss") {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
