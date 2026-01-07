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
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");
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
      setError(t("login.error"));
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

          <LoadingButton
            type="submit"
            className={styles.button}
            loading={loading}
            loadingLabel={t("login.loading")}
            disabled={loading}
          >
            {t("login.submit")}
          </LoadingButton>
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
