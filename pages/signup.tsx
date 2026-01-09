import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Layout from "@/layout/layout";
import styles from "@/styles/signup.module.scss";
import { getSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast";
import LoadingButton from "@/components/LoadingButton";

type PlanInfo = {
  labelKey: string;
  price: string;
  periodKey: string;
  summaryKey: string;
};

const planDetails: Record<string, PlanInfo> = {
  silver: {
    labelKey: "signup.plan.silver.label",
    price: "$9.90",
    periodKey: "signup.plan.period.month",
    summaryKey: "signup.plan.silver.summary",
  },
  gold: {
    labelKey: "signup.plan.gold.label",
    price: "$19.90",
    periodKey: "signup.plan.period.month",
    summaryKey: "signup.plan.gold.summary",
  },
};

export default function SignupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const plan = (router.query.plan as string) || "silver";
  const planInfo = planDetails[plan] ?? planDetails.silver;
  const [message, setMessage] = useState("");
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);
  const [step, setStep] = useState<"details" | "code">("details");
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null
  );
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    venue: "",
  });
  const [code, setCode] = useState("");

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const extractExpiry = (token?: string | null) => {
    if (!token) return null;
    try {
      const [base] = token.split(".");
      if (!base) return null;
      const padded = base.replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(padded + "===".slice((padded.length + 3) % 4));
      const payload = JSON.parse(json) as { exp?: number };
      return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const left = Math.max(0, expiresAt - Date.now());
      setTimeLeft(left);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const onSubmitDetails = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (detailsLoading) return;
    setMessage("");
    setSentToEmail(null);
    setExpiresAt(null);
    setTimeLeft(null);
    setDetailsLoading(true);
    const passwordOk =
      formValues.password.length >= 8 &&
      /[a-z]/.test(formValues.password) &&
      /[A-Z]/.test(formValues.password) &&
      /\d/.test(formValues.password);
    if (!passwordOk) {
      const msg = t("signup.msg.passwordWeak");
      setMessage(msg);
      toast.addToast(msg, "error");
      setDetailsLoading(false);
      return;
    }
    if (formValues.password !== formValues.confirmPassword) {
      const msg = t("signup.msg.passwordMismatch");
      setMessage(msg);
      toast.addToast(msg, "error");
      setDetailsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/signup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formValues, plan }),
      });
      if (!res.ok) {
        let serverError = "";
        try {
          const data = (await res.json()) as { error?: string };
          serverError = data.error ?? "";
        } catch {
          serverError = "";
        }
        throw new Error(serverError || "request");
      }
      const data = (await res.json()) as { token?: string };
      setVerificationToken(data.token ?? null);
      setSentToEmail(formValues.email);
      const exp = extractExpiry(data.token ?? null);
      setExpiresAt(exp ?? Date.now() + 2 * 60 * 1000);
      setStep("code");
      setMessage(t("signup.msg.sentCode"));
    } catch (err) {
      if (err instanceof Error) {
        const errorKeyMap: Record<string, string> = {
          MISSING_FIELDS: "signup.msg.missingFields",
          EMAIL_NOT_CONFIGURED: "signup.msg.emailNotConfigured",
          EMAIL_SEND_FAILED: "signup.msg.emailSendFailed",
          request: "signup.msg.requestFailed",
        };
        const mappedKey = errorKeyMap[err.message];
        const msg = mappedKey ? t(mappedKey) : t("signup.msg.requestFailed");
        setMessage(msg);
        toast.addToast(msg, "error");
      } else {
        const msg = t("signup.msg.requestFailed");
        setMessage(msg);
        toast.addToast(msg, "error");
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const onVerifyCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (verifyLoading) return;
    setMessage("");
    setSentToEmail(null);
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/signup-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          token: verificationToken,
          plan,
          password: formValues.password,
        }),
      });
      if (!res.ok) {
        let serverError = "";
        try {
          const data = (await res.json()) as { error?: string };
          serverError = data.error ?? "";
        } catch {
          serverError = "";
        }
        throw new Error(serverError || "verify");
      }
      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: formValues.email }),
      });
      const checkoutData = (await checkoutRes.json()) as {
        url?: string;
        error?: string;
      };
      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error || "checkout");
      }
      window.location.href = checkoutData.url;
    } catch (err) {
      if (err instanceof Error) {
        const errorKeyMap: Record<string, string> = {
          MISSING_FIELDS: "signup.msg.missingFields",
          INVALID_TOKEN: "signup.msg.invalidCode",
          INCORRECT_CODE: "signup.msg.invalidCode",
          INVALID_EMAIL: "signup.msg.invalidEmail",
          INVALID_VENUE: "signup.msg.invalidVenue",
          WEAK_PASSWORD: "signup.msg.passwordWeak",
          EMAIL_EXISTS: "signup.msg.emailExists",
          verify: "signup.msg.invalidCode",
          INVALID_PLAN: "signup.msg.invalidPlan",
          MISSING_CHECKOUT_URL: "signup.msg.checkoutFailed",
          CHECKOUT_SESSION_CREATE_FAILED: "signup.msg.checkoutFailed",
          checkout: "signup.msg.checkoutFailed",
        };
        const mappedKey = errorKeyMap[err.message];
        const msg = mappedKey ? t(mappedKey) : t("signup.msg.checkoutFailed");
        setMessage(msg);
        toast.addToast(msg, "error");
      } else {
        const msg = t("signup.msg.checkoutFailed");
        setMessage(msg);
        toast.addToast(msg, "error");
      }
      setVerifyLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>{t("signup.seo.title")}</title>
        <meta name="description" content={t("signup.seo.description")} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className={styles.page}>
        <div className={styles.card}>
          <div>
            <h2 className={styles.sectionTitle}>{t("signup.selectedPlan")}</h2>
            <p className={styles.sectionSubtitle}>{t(planInfo.labelKey)}</p>
            <div className={styles.planPrice}>
              <span>{planInfo.price}</span>
              <span className={styles.planPeriod}>
                {t(planInfo.periodKey)}
              </span>
            </div>
            <p className={`${styles.sectionSubtitle} ${styles.planSummary}`}>
              {t(planInfo.summaryKey)}
            </p>
          </div>

          <div className={styles.formCard}>
            {step === "details" ? (
              <form className={styles.form} onSubmit={onSubmitDetails}>
                <h3 className={styles.sectionSubtitle}>
                  {t("signup.accountDetails")}
                </h3>

                <label className={styles.label} htmlFor="email">
                  {t("signup.email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={styles.input}
                  value={formValues.email}
                  disabled={detailsLoading}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                />

                <label className={styles.label} htmlFor="password">
                  {t("signup.password")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className={styles.input}
                  value={formValues.password}
                  disabled={detailsLoading}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />

                <label className={styles.label} htmlFor="confirmPassword">
                  {t("signup.confirmPassword")}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className={styles.input}
                  value={formValues.confirmPassword}
                  disabled={detailsLoading}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                />

                <label className={styles.label} htmlFor="venue">
                  {t("signup.venueName")}
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  className={styles.input}
                  value={formValues.venue}
                  disabled={detailsLoading}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      venue: e.target.value,
                    }))
                  }
                  required
                />

                <LoadingButton
                  type="submit"
                  className={styles.button}
                  loading={detailsLoading}
                  loadingLabel={t("signup.loading.continue")}
                  disabled={detailsLoading}
                >
                  {t("signup.continue")}
                </LoadingButton>
              </form>
            ) : step === "code" ? (
              <form className={styles.form} onSubmit={onVerifyCode}>
                <h3
                  className={`${styles.sectionSubtitle} ${styles.codeHeading}`}
                >
                  {t("signup.enterCode")}
                </h3>
                {timeLeft !== null && (
                  <p className={styles.codeTimer}>
                    {timeLeft > 0
                      ? t("signup.expiresIn", { time: formatTime(timeLeft) })
                      : t("signup.codeExpired")}
                  </p>
                )}
                <input
                  id="code"
                  name="code"
                  type="text"
                  className={styles.input}
                  value={code}
                  disabled={verifyLoading}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <LoadingButton
                  type="submit"
                  className={styles.button}
                  loading={verifyLoading}
                  loadingLabel={t("signup.loading.verify")}
                  disabled={verifyLoading}
                >
                  {t("signup.verifyCode")}
                </LoadingButton>
              </form>
            ) : null}
            {message && (
              <p className={styles.note}>
                {sentToEmail ? (
                  <span
                    className={styles.sentCodeMessage}
                    dangerouslySetInnerHTML={{
                      __html: t("signup.msg.sentCode", {
                        email: `<span class="${styles.emailHighlight}">${sentToEmail}</span>`,
                      }),
                    }}
                  />
                ) : (
                  message
                )}
              </p>
            )}
          </div>
        </div>
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
