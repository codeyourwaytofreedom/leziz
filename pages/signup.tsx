import { FormEvent, useState } from "react";
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
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    venue: "",
  });
  const onSubmitDetails = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (detailsLoading) return;
    setMessage("");
    setSentToEmail(null);
    setSubmitted(false);
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
      await res.json();
      setSentToEmail(formValues.email);
      const msg = t("signup.msg.sentCode", { email: formValues.email });
      setMessage(msg);
      toast.addToast(msg, "info");
      setSubmitted(true);
    } catch (err) {
      if (err instanceof Error) {
        const errorKeyMap: Record<string, string> = {
          MISSING_FIELDS: "signup.msg.missingFields",
          EMAIL_NOT_CONFIGURED: "signup.msg.emailNotConfigured",
          EMAIL_SEND_FAILED: "signup.msg.emailSendFailed",
          INVALID_EMAIL: "signup.msg.invalidEmail",
          INVALID_VENUE: "signup.msg.invalidVenue",
          WEAK_PASSWORD: "signup.msg.passwordWeak",
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
                  disabled={detailsLoading || submitted}
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
                  disabled={detailsLoading || submitted}
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
                  disabled={detailsLoading || submitted}
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
                  disabled={detailsLoading || submitted}
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
                  disabled={detailsLoading || submitted}
                >
                  {submitted ? t("signup.sent") : t("signup.continue")}
                </LoadingButton>
              </form>
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
