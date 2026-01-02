import { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/layout/layout";
import { getSession } from "@/lib/session";
import styles from "@/styles/home.module.scss";
import waiterImg from "@/assets/landingPage/waiter-serving-friends-at-pub.jpg";
import corridorHeroImg from "@/assets/landingPage/cozy-restaurant-corridor-tables.jpg";
import ambienceImg from "@/assets/landingPage/restaurant-with-green-wall-wooden-table-with-row-tables-planter-with-plant-background.jpg";
import friendsImg from "@/assets/landingPage/group-friends-eating-restaurant.jpg";

type HomeProps = {
  isLoggedIn: boolean;
};

export default function Home({ isLoggedIn }: HomeProps) {
  const primaryCta = isLoggedIn ? "/owner/menu" : "/login";

  return (
    <Layout isLoggedIn={isLoggedIn}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>Menus that speak every language</p>
            <h1 className={styles.title}>
              Serve guests faster with a beautifully translated digital menu.
            </h1>
            <p className={styles.subtitle}>
              Build, translate, and publish your menu in minutes. Share with a
              QR code, update pricing on the fly, and keep guests in the loop in
              their own language.
            </p>
            <div className={styles.ctaRow}>
              <Link href={primaryCta} className={styles.primaryCta}>
                Get started
              </Link>
              <Link href="/menu/demo66" className={styles.secondaryCta}>
                See a live menu
              </Link>
            </div>
            <div className={styles.stats}>
              <div>
                <strong>3+</strong>
                <span>Languages per menu</span>
              </div>
              <div>
                <strong>1 click</strong>
                <span>QR updates</span>
              </div>
              <div>
                <strong>0 hassle</strong>
                <span>No PDF uploads</span>
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
              />
              <div className={styles.heroCaption}>
                A menu that feels as inviting as your space.
              </div>
            </div>
          </div>
        </section>
        <div className={styles.heroCardWide}>
          <Image
            src={waiterImg}
            alt="Waiter serving friends at a pub"
            className={`${styles.heroImage} ${styles.heroImageWide}`}
            placeholder="blur"
          />
          <div className={styles.heroCaption}>Staff-friendly QR menus.</div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Everything you need to run a modern menu</h2>
            <p>
              Build categories, price dishes, and translate instantly. Your
              guests see a polished experience; your team gets a simple editor.
            </p>
          </div>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.pill}>Translations</div>
              <h3>Localized by design</h3>
              <p>
                Edit in one language and keep translations side by side. Switch
                the editor language to verify every detail before publishing.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.pill}>QR &amp; Sharing</div>
              <h3>QRs that never go stale</h3>
              <p>
                Share one QR and keep updating your menu. Guests always see the
                latest prices, specials, and dietary notes.
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.pill}>Control</div>
              <h3>Real-time pricing</h3>
              <p>
                Change prices mid-service, hide sold-out items, or add a new
                special in seconds—no design software required.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Built for dining rooms and patios</h2>
            <p>
              From cozy bistros to lively pubs, deliver a consistent digital
              menu that feels premium and personal.
            </p>
          </div>
          <div className={styles.gallery}>
            <div className={styles.galleryCard}>
              <Image
                src={ambienceImg}
                alt="Restaurant with warm green wall and wooden tables"
                className={styles.galleryImage}
                placeholder="blur"
              />
              <div className={styles.galleryText}>
                <h3>Ambience first</h3>
                <p>
                  Clean layouts that let your food and atmosphere shine—no
                  clutter, just clarity.
                </p>
              </div>
            </div>
            <div className={styles.galleryCard}>
              <Image
                src={friendsImg}
                alt="Friends enjoying a meal together at a restaurant"
                className={styles.galleryImage}
                placeholder="blur"
              />
              <div className={styles.galleryText}>
                <h3>Service-ready</h3>
                <p>
                  Fast to load, easy to scan, and effortless for staff to point
                  guests to the right dish.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async (
  ctx
) => {
  const session = getSession(ctx.req);

  return {
    props: {
      isLoggedIn: Boolean(session),
    },
  };
};
