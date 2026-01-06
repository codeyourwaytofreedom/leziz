import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import Layout from "@/layout/layout";
import styles from "@/styles/signup.module.scss";
import { getSession } from "@/lib/session";

type PlanInfo = {
  label: string;
  price: string;
  period: string;
  summary: string;
};

const planDetails: Record<string, PlanInfo> = {
  monthly: {
    label: "Monthly",
    price: "€9",
    period: "/month",
    summary: "Up to 3 languages, unlimited items, QR updates.",
  },
  yearly: {
    label: "Yearly",
    price: "€90",
    period: "/year",
    summary: "Same as monthly with 2 months free.",
  },
  premium: {
    label: "Premium",
    price: "€175",
    period: "/year",
    summary: "6 languages, logo, WhatsApp link, unlimited updates.",
  },
};

export default function SignupPage() {
  const router = useRouter();
  const plan = (router.query.plan as string) || "monthly";
  const planInfo = planDetails[plan] ?? planDetails.monthly;
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"details" | "code">("details");
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    venue: "",
  });
  const [code, setCode] = useState("");

  const onSubmitDetails = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    if (formValues.password !== formValues.confirmPassword) {
      setMessage("Passwords do not match.");
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
      setStep("code");
      setMessage("We sent a confirmation code to your email (placeholder).");
    } catch {
      setMessage("Could not start signup. Please try again.");
    }
  };

  const onVerifyCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/auth/signup-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, token: verificationToken, plan }),
      });
      if (!res.ok) throw new Error();
      setMessage("Code verified. Would now redirect to Stripe Checkout.");
      // TODO: redirect to Stripe Checkout after verification
    } catch {
      setMessage("Invalid or expired code. Please try again.");
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.card}>
          <div>
            <h2 className={styles.sectionTitle}>Selected plan</h2>
            <p className={styles.sectionSubtitle}>{planInfo.label}</p>
            <div className={styles.planPrice}>
              <span>{planInfo.price}</span>
              <span className={styles.planPeriod}>{planInfo.period}</span>
            </div>
            <p className={styles.sectionSubtitle}>{planInfo.summary}</p>
          </div>

          <div className={styles.formCard}>
            {step === "details" ? (
              <form className={styles.form} onSubmit={onSubmitDetails}>
                <h3 className={styles.sectionSubtitle}>Account details</h3>

                <label className={styles.label} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={styles.input}
                  value={formValues.email}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />

                <label className={styles.label} htmlFor="password">
                  Password
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
                  Confirm password
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
                  Venue name
                </label>
                <input
                  id="venue"
                  name="venue"
                  type="text"
                  className={styles.input}
                  value={formValues.venue}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, venue: e.target.value }))
                  }
                  required
                />

                <button type="submit" className={styles.button}>
                  Continue
                </button>
              </form>
            ) : (
              <form className={styles.form} onSubmit={onVerifyCode}>
                <h3 className={styles.sectionSubtitle}>Enter verification code</h3>
                <label className={styles.label} htmlFor="code">
                  Code
                </label>
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
                  Verify code
                </button>
              </form>
            )}
            {message && <p className={styles.note}>{message}</p>}
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
