import { GetServerSideProps } from "next";
import Link from "next/link";

import Layout from "@/layout/layout";
import styles from "@/styles/pricing.module.scss";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { useI18n } from "@/lib/i18n";

const plans = [
  {
    nameKey: "pricing.silver.name",
    slug: "silver",
    price: "$9.90",
    periodKey: "pricing.silver.period",
    taglineKey: "pricing.silver.tagline",
    highlightKey: "pricing.silver.highlight",
    features: [
      "pricing.feature.languages3",
      "pricing.feature.unlimited",
      "pricing.feature.qr",
      "pricing.feature.editor",
      " ",
      " ",
    ],
  },
  {
    nameKey: "pricing.gold.name",
    slug: "gold",
    price: "$19.90",
    periodKey: "pricing.gold.period",
    taglineKey: "pricing.gold.tagline",
    highlightKey: "pricing.gold.highlight",
    features: [
      "pricing.feature.languages6",
      "pricing.feature.logo",
      "pricing.feature.whatsapp",
      "pricing.feature.unlimited",
      "pricing.feature.qr",
      "pricing.feature.editor",
    ],
  },
];

type PricingProps = {
  isLoggedIn: boolean;
  venueName: string | null;
  role: string | null;
};

export default function PricingPage({
  isLoggedIn,
  venueName,
  role,
}: PricingProps) {
  const { t } = useI18n();

  return (
    <Layout
      isLoggedIn={isLoggedIn}
      venueName={venueName ?? undefined}
      role={role ?? undefined}
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t("pricing.title")}</h1>
          <p className={styles.subtitle}>{t("pricing.subtitle")}</p>
        </header>

        <div className={styles.cards}>
          {plans.map((plan) => (
            <Link
              key={plan.nameKey}
              className={`${styles.card} ${
                plan.slug === "silver" ? styles.cardSilver : styles.cardGold
              }`}
              href={`/signup?plan=${plan.slug}`}
            >
              <div className={styles.cardTop}>
                <p className={styles.planName}>{t(plan.nameKey)}</p>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{plan.price}</span>
                  <span className={styles.period}>{t(plan.periodKey)}</span>
                </div>
                {plan.highlightKey && (
                  <span className={styles.badge}>{t(plan.highlightKey)}</span>
                )}
              </div>
              <div className={styles.cardBody}>
                <ul className={styles.features}>
                  {plan.features.map((featKey, idx) =>
                    featKey && featKey.trim().length > 0 ? (
                      <li key={`${plan.nameKey}-${idx}`}>{t(featKey)}</li>
                    ) : (
                      <li key={`${plan.nameKey}-${idx}`} aria-hidden="true" />
                    )
                  )}
                </ul>
                <span className={styles.cta}>{t("pricing.cta")}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<PricingProps> = async (
  ctx
) => {
  const session = getSession(ctx.req);
  let venueName: string | undefined;
  const role = session?.role ?? null;

  if (session?.venueId) {
    const db = await getDb();
    const venue = await db
      .collection("venues")
      .findOne({ _id: new ObjectId(session.venueId) });
    if (venue?.name) {
      venueName = typeof venue.name === "string" ? venue.name : venue.name.en;
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
