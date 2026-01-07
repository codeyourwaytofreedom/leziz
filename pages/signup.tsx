import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import Layout from "@/layout/layout";
import styles from "@/styles/signup.module.scss";
import { getSession } from "@/lib/session";
import { useI18n } from "@/lib/i18n";

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
  const plan = (router.query.plan as string) || "silver";
  const planInfo = planDetails[plan] ?? planDetails.silver;
  const [message, setMessage] = useState("");
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);
  const [step, setStep] = useState<"details" | "code" | "stripe">("details");
  const [verificationToken, setVerificationToken] = useState<string | null>(
    null
  );
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
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
    setMessage("");
    setSentToEmail(null);
    setExpiresAt(null);
    setTimeLeft(null);
    if (formValues.password !== formValues.confirmPassword) {
      setMessage(t("signup.msg.passwordMismatch"));
      return;
    }
    try {
      const res = await fetch("/api/auth/signup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formValues, plan }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { token?: string };
      setVerificationToken(data.token ?? null);
      setSentToEmail(formValues.email);
      const exp = extractExpiry(data.token ?? null);
      setExpiresAt(exp ?? Date.now() + 2 * 60 * 1000);
      setStep("code");
      setMessage(t("signup.msg.sentCodePrefix"));
    } catch {
      setMessage(t("signup.msg.requestFailed"));
    }
  };

  const onVerifyCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setSentToEmail(null);
    setVerifiedEmail(null);
    try {
      const res = await fetch("/api/auth/signup-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, token: verificationToken, plan }),
      });
      if (!res.ok) throw new Error();
      setVerifiedEmail(formValues.email);
      setStep("stripe");
      setMessage("");
    } catch {
      setMessage(t("signup.msg.invalidCode"));
    }
  };

  const onCheckout = async () => {
    if (!verifiedEmail) {
      setMessage(t("signup.msg.missingVerifiedEmail"));
      return;
    }
    setCheckoutLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: verifiedEmail }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout failed");
      }
      window.location.href = data.url;
    } catch {
      setMessage(t("signup.msg.checkoutFailed"));
      setCheckoutLoading(false);
    }
  };

  return (
    <Layout>
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
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      venue: e.target.value,
                    }))
                  }
                  required
                />

                <button type="submit" className={styles.button}>
                  {t("signup.continue")}
                </button>
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
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <button type="submit" className={styles.button}>
                  {t("signup.verifyCode")}
                </button>
              </form>
            ) : (
              <div className={styles.stripeCard}>
                <h3 className={styles.sectionSubtitle}>
                  {t("signup.stripeTitle")}
                </h3>
                <p className={styles.sectionSubtitle}>
                  {t("signup.stripeBody")}
                </p>
                <button
                  type="button"
                  className={styles.button}
                  onClick={onCheckout}
                  disabled={checkoutLoading}
                >
                  {t("signup.continueCheckout")}
                </button>
              </div>
            )}
            {message && (
              <p className={styles.note}>
                {message}
                {sentToEmail && (
                  <>
                    {" "}
                    <span className={styles.emailHighlight}>{sentToEmail}</span>
                    {t("signup.msg.sentCodeSuffix")}
                  </>
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
