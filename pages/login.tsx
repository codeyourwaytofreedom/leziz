import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";

import Layout from "@/layout/layout";
import styles from "@/styles/login.module.scss";
import { getSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import LoadingButton from "@/components/LoadingButton";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendingInfo, setPendingInfo] = useState<{
    email: string;
    plan: string;
  } | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setPendingInfo(null);
    setLoading(true);

    const form = event.currentTarget;
    const email = (form.elements.namedItem("username") as HTMLInputElement)
      .value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      let serverError = "";
      let pendingPayload: { email?: string | null; plan?: string | null } = {};
      try {
        const data = (await res.json()) as {
          error?: string;
          email?: string | null;
          plan?: string | null;
        };
        serverError = data.error ?? "";
        pendingPayload = { email: data.email, plan: data.plan };
      } catch {
        serverError = "";
      }
      if (serverError === "ACCOUNT_PENDING") {
        if (pendingPayload.email && pendingPayload.plan) {
          setPendingInfo({
            email: pendingPayload.email,
            plan: pendingPayload.plan,
          });
          setError(t("login.pendingMessage"));
        } else {
          setError(t("login.pendingMissingPlan"));
        }
      } else if (serverError === "MISSING_CREDENTIALS") {
        setError(t("login.missingCredentials"));
      } else {
        setError(t("login.error"));
      }
      setLoading(false);
      return;
    }

    // cookie is now set by the server
    try {
      const data = (await res.json()) as {
        ok?: boolean;
        role?: string | null;
        venueId?: string | null;
      };
      const next = data.role === "bigboss" ? "/bigboss" : "/owner/menu";
      router.push(next);
    } catch {
      router.push("/owner/menu");
    }
  };

  const handleContinuePayment = async () => {
    if (!pendingInfo || pendingLoading) return;
    setPendingLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: pendingInfo.plan,
          email: pendingInfo.email,
          source: "login",
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        const msg =
          data.error === "INVALID_PLAN"
            ? t("login.invalidPlan")
            : t("login.checkoutFailed");
        setError(msg);
        setPendingLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t("login.checkoutFailed"));
      setPendingLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.wrapper}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1 className={styles.title}>{t("login.title")}</h1>

          <label className={styles.label} htmlFor="username">
            {t("login.email")}
          </label>
          <input
            id="username"
            name="username"
            type="email"
            className={styles.input}
            placeholder={t("login.emailPlaceholder")}
            disabled={loading}
            required
          />

          <label className={styles.label} htmlFor="password">
            {t("login.password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={styles.input}
            placeholder={t("login.passwordPlaceholder")}
            disabled={loading}
            required
          />

          {error && <p style={{ color: "red" }}>{error}</p>}
          {pendingInfo && (
            <button
              type="button"
              className={styles.button}
              onClick={handleContinuePayment}
              disabled={pendingLoading}
            >
              {pendingLoading
                ? t("login.pendingLoading")
                : t("login.pendingCta")}
            </button>
          )}

          {!pendingInfo && (
            <LoadingButton
              type="submit"
              className={styles.button}
              loading={loading}
              loadingLabel={t("login.loading")}
              disabled={loading}
            >
              {t("login.submit")}
            </LoadingButton>
          )}
        </form>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = getSession(ctx.req);
  if (session) {
    return {
      redirect: { destination: "/owner/menu", permanent: false },
    };
  }

  return { props: {} };
};
