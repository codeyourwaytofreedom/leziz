import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "@/layout/layout";
import { useI18n } from "@/lib/i18n";
import styles from "@/styles/signup.module.scss";

export default function SignupVerifyPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [payload, setPayload] = useState<{ email: string; plan: string } | null>(
    null
  );
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const token =
      typeof router.query.token === "string" ? router.query.token : null;

    const run = async () => {
      try {
        if (!token) {
          await Promise.resolve();
          setStatus("error");
          setMessage(t("signup.verify.missingToken"));
          return;
        }
        const res = await fetch(
          `/api/auth/signup-verify?token=${encodeURIComponent(token)}`
        );
        const data = (await res.json()) as {
          ok?: boolean;
          email?: string;
          plan?: string;
          error?: string;
        };
        if (!res.ok) {
          const errorKeyMap: Record<string, string> = {
            MISSING_TOKEN: "signup.verify.missingToken",
            INVALID_TOKEN: "signup.verify.invalidToken",
            ALREADY_ACTIVE: "signup.verify.alreadyActive",
            REQUEST_NOT_FOUND: "signup.verify.invalidToken",
            INVALID_STATUS: "signup.verify.invalidToken",
            INVALID_EMAIL: "signup.verify.invalidToken",
            INVALID_VENUE: "signup.verify.invalidToken",
            INVALID_PASSWORD: "signup.verify.invalidToken",
            MISSING_PLAN: "signup.verify.invalidToken",
          };
          const msgKey = data.error ? errorKeyMap[data.error] : null;
          setStatus("error");
          setMessage(msgKey ? t(msgKey) : t("signup.verify.checkoutFailed"));
          return;
        }
        setPayload({
          email: data.email ?? "",
          plan: data.plan ?? "",
        });
        setStatus("ready");
      } catch {
        setStatus("error");
        setMessage(t("signup.verify.checkoutFailed"));
      }
    };

    run();
  }, [router.isReady, router.query.token, t]);

  return (
    <Layout>
      <Head>
        <title>{t("signup.verify.title")}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className={styles.page}>
        <div
          className={`${styles.card} ${
            status === "ready" ? styles.successCard : ""
          }`}
        >
          {status === "loading" && (
            <>
              <h1 className={styles.sectionTitle}>
                {t("signup.verify.title")}
              </h1>
              <p className={styles.sectionSubtitle}>
                {t("signup.verify.loading")}
              </p>
            </>
          )}
          {status === "ready" && (
            <>
              <h1 className={styles.sectionTitle} style={{ textAlign: "center" }}>
                {t("signup.verify.successTitle")}
              </h1>
              <div className={styles.paymentCard} style={{ textAlign: "center" }}>
                <p className={`${styles.sectionSubtitle} ${styles.successMessage}`}>
                  <span className={styles.successIcon}>✓</span>
                  {t("signup.stripeBody")}
                </p>
                <button
                  type="button"
                  className={styles.button}
                  onClick={async () => {
                    if (!payload || loadingCheckout) return;
                    setLoadingCheckout(true);
                    try {
                      const res = await fetch("/api/stripe/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          plan: payload.plan,
                          email: payload.email,
                          source: "signup",
                        }),
                      });
                      const data = (await res.json()) as {
                        url?: string;
                        error?: string;
                      };
                      if (!res.ok || !data.url) {
                        setStatus("error");
                        setMessage(t("signup.verify.checkoutFailed"));
                        setLoadingCheckout(false);
                        return;
                      }
                      window.location.href = data.url;
                    } catch {
                      setStatus("error");
                      setMessage(t("signup.verify.checkoutFailed"));
                      setLoadingCheckout(false);
                    }
                  }}
                  disabled={loadingCheckout}
                >
                  {loadingCheckout
                    ? t("signup.verify.ctaLoading")
                    : t("signup.verify.cta")}
                </button>
              </div>
            </>
          )}
          {status === "error" && (
            <>
              <h1 className={styles.sectionTitle} style={{ textAlign: "center" }}>
                {t("signup.verify.failedTitle")}
              </h1>
              <div className={styles.paymentCard} style={{ textAlign: "center" }}>
                <p className={`${styles.sectionSubtitle} ${styles.errorMessage}`}>
                  <span className={styles.errorIcon}>!</span>
                  {message ?? t("signup.verify.checkoutFailed")}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
