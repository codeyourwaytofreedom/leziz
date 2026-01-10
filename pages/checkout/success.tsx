import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ObjectId } from "mongodb";
import Layout from "@/layout/layout";
import { useI18n } from "@/lib/i18n";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";

type SuccessProps = {
  isLoggedIn: boolean;
  venueName: string | null;
  role: string | null;
};

export default function CheckoutSuccess({
  isLoggedIn,
  venueName,
  role,
}: SuccessProps) {
  const { t } = useI18n();
  const [refreshState, setRefreshState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    const run = async () => {
      setRefreshState("loading");
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (!active) return;
        setRefreshState(res.ok ? "ready" : "error");
      } catch {
        if (!active) return;
        setRefreshState("error");
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [isLoggedIn]);
  return (
    <Layout
      isLoggedIn={isLoggedIn}
      venueName={venueName ?? undefined}
      role={role ?? undefined}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>{t("checkout.success.title")}</h1>
        <p>{t("checkout.success.body")}</p>
        <p style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>
          {!isLoggedIn
            ? t("checkout.success.loginHint")
            : refreshState === "loading"
            ? t("checkout.success.refreshing")
            : refreshState === "error"
            ? t("checkout.success.refreshFailed")
            : t("checkout.success.ready")}
        </p>
        {isLoggedIn ? (
          <Link
            href="/owner/menu"
            style={{
              display: "inline-flex",
              marginTop: "1rem",
              padding: "0.7rem 1rem",
              borderRadius: "10px",
              border: "1px solid var(--color-border-strong)",
              background: "var(--color-primary)",
              color: "#fff",
              fontWeight: 700,
              pointerEvents: refreshState === "ready" ? "auto" : "none",
              opacity: refreshState === "ready" ? 1 : 0.6,
            }}
          >
            {t("checkout.success.cta")}
          </Link>
        ) : (
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              marginTop: "1rem",
              padding: "0.7rem 1rem",
              borderRadius: "10px",
              border: "1px solid var(--color-border-strong)",
              background: "var(--color-primary)",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            {t("checkout.success.loginCta")}
          </Link>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<SuccessProps> = async (
  ctx
) => {
  const session = getSession(ctx.req);
  let venueName: string | undefined;
  const role = session?.role ?? null;
  const db = session ? await getDb() : null;

  if (session?.venueId && db) {
    const venue = await db
      .collection("venues")
      .findOne({ _id: new ObjectId(session.venueId) });
    if (venue?.name) {
      venueName = typeof venue.name === "string" ? venue.name : venue.name.en;
    }
  }

  if (!venueName && session?.userId && db && ObjectId.isValid(session.userId)) {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(session.userId) });
    if (user?.venueName) {
      venueName =
        typeof user.venueName === "string" ? user.venueName : user.venueName.en;
    }
  }

  return {
    props: {
      isLoggedIn: Boolean(session),
      venueName: venueName ?? null,
      role,
    },
  };
};
