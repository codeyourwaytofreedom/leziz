import { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";

import Layout from "@/layout/layout";
import { getSession } from "@/lib/session";
import styles from "@/styles/home.module.scss";
import waiterImg from "@/assets/landingPage/waiter-service.jpg";
import corridorHeroImg from "@/assets/landingPage/corridor-cozy.jpg";
import ambienceImg from "@/assets/landingPage/green-restaurant.jpg";
import friendsImg from "@/assets/landingPage/friends-dining.jpg";
import qrImg from "@/assets/qr.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faUtensils,
  faBurger,
  faPizzaSlice,
  faIceCream,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useI18n } from "@/lib/i18n";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type HomeProps = {
  isLoggedIn: boolean;
  venueName: string | null;
  role: string | null;
};

export default function Home({ isLoggedIn, venueName, role }: HomeProps) {
  const { t } = useI18n();
  const primaryCta = isLoggedIn ? "/pricing" : "/pricing";
  const whatsappUrl =
    process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/";

  return (
    <Layout
      isLoggedIn={isLoggedIn}
      venueName={venueName ?? undefined}
      role={role ?? undefined}
    >
      <Head>
        <title>{t("home.seo.title")}</title>
        <meta name="description" content={t("home.seo.description")} />
        <meta property="og:title" content={t("home.seo.ogTitle")} />
        <meta
          property="og:description"
          content={t("home.seo.ogDescription")}
        />
        <meta property="og:type" content="website" />
      </Head>
      <div className={styles.page}>
        <div className={styles.banner}>
          <div className={styles.qrRow}>
            <div className={styles.qrContainer}>
              <div className={styles.qrFloat} aria-hidden="true">
                <span className={`${styles.qrIcon} ${styles.qrIcon1}`}>
                  <FontAwesomeIcon icon={faUtensils} />
                </span>
                <span className={`${styles.qrIcon} ${styles.qrIcon2}`}>
                  <FontAwesomeIcon icon={faBurger} />
                </span>
                <span className={`${styles.qrIcon} ${styles.qrIcon3}`}>
                  <FontAwesomeIcon icon={faPizzaSlice} />
                </span>
                <span className={`${styles.qrIcon} ${styles.qrIcon4}`}>
                  <FontAwesomeIcon icon={faIceCream} />
                </span>
                <div className={styles.qrFrame}>
                  <Image
                    src={qrImg}
                    alt=""
                    fill
                    sizes="140px"
                    className={styles.qrImage}
                    priority
                  />
                </div>
              </div>
            </div>
            <div className={styles.qrBannerText}>
              <div className={styles.qrBannerTitle}>QR Menus</div>
              <p className={styles.bannerTagline}>{t("home.tagline")}</p>
            </div>
          </div>
        </div>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>{t("home.title")}</h1>
            <p className={styles.subtitle}>{t("home.subtitle")}</p>
            <div className={styles.ctaRow}>
              <Link href={primaryCta} className={styles.primaryCta}>
                {t("home.cta.primary")}
              </Link>
              <Link
                href="/menu/d11fcd2ed6454e6e"
                target="blank"
                className={styles.secondaryCta}
              >
                {t("home.cta.secondary")}
              </Link>
            </div>
            <div className={styles.stats}>
              <div>
                <strong>{t("home.stats.languages.value")}</strong>
                <span>{t("home.stats.languages")}</span>
              </div>
              <div>
                <strong>{t("home.stats.qr.value")}</strong>
                <span>{t("home.stats.qr")}</span>
              </div>
              <div>
                <strong>{t("home.stats.nopdf.value")}</strong>
                <span>{t("home.stats.nopdf")}</span>
              </div>
            </div>
          </div>
          <div className={styles.heroGallery}>
            <div className={styles.heroCardTall}>
              <Image
                src={corridorHeroImg}
                alt="Cozy restaurant corridor with intimate tables"
                className={styles.heroImage}
                placeholder="blur"
                priority
                sizes="(min-width: 1024px) 420px, (min-width: 768px) 360px, 90vw"
              />
              <div className={styles.heroCaption}>{t("home.hero.caption")}</div>
            </div>
          </div>
        </section>
        <section
          className={`${styles.section} ${styles.emptySection}`}
          aria-label="Placeholder"
        >
          <div className={styles.emptyInner}>
            <h2>{t("home.offers.title")}</h2>
            <p>{t("home.offers.subtitle")}</p>
            <Link href="/pricing" className={styles.emptyButton}>
              {t("home.offers.button")}
            </Link>
          </div>
        </section>
        <div className={styles.heroCardWide}>
          <Image
            src={waiterImg}
            alt="Waiter serving friends at a pub"
            className={`${styles.heroImage} ${styles.heroImageWide}`}
            placeholder="blur"
            sizes="(min-width: 1024px) 680px, 100vw"
          />
          <div className={styles.heroCaption}>Staff-friendly QR menus.</div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>{t("home.section.features.title")}</h2>
            <p>{t("home.section.features.subtitle")}</p>
          </div>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.pill}>Translations</div>
              <h3>{t("home.feature.translations.title")}</h3>
              <p>{t("home.feature.translations.desc")}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.pill}>QR &amp; Sharing</div>
              <h3>{t("home.feature.qr.title")}</h3>
              <p>{t("home.feature.qr.desc")}</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.pill}>Control</div>
              <h3>{t("home.feature.control.title")}</h3>
              <p>{t("home.feature.control.desc")}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>{t("home.section.gallery.title")}</h2>
            <p>{t("home.section.gallery.subtitle")}</p>
          </div>
          <div className={styles.gallery}>
            <div className={styles.galleryCard}>
              <Image
                src={ambienceImg}
                alt="Restaurant with warm green wall and wooden tables"
                className={styles.galleryImage}
                placeholder="blur"
                sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
              />
              <div className={styles.galleryText}>
                <h3>{t("home.gallery.ambience.title")}</h3>
                <p>{t("home.gallery.ambience.desc")}</p>
              </div>
            </div>
            <div className={styles.galleryCard}>
              <Image
                src={friendsImg}
                alt="Friends enjoying a meal together at a restaurant"
                className={styles.galleryImage}
                placeholder="blur"
                sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 100vw"
              />
              <div className={styles.galleryText}>
                <h3>{t("home.gallery.service.title")}</h3>
                <p>{t("home.gallery.service.desc")}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <a
        className={styles.whatsappFloat}
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        <FontAwesomeIcon icon={faWhatsapp as IconProp} beat />
      </a>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async (
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
