import Image from "next/image";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import styles from "@/styles/publicMenu.module.scss";
import { LocalizedText, Menu } from "@/types/menu";
import logo from "@/assets/leziz-logo.png";

type Props = {
  menu: Menu;
  languages: string[];
};

type Language = string;

function resolveText(value: LocalizedText | undefined, lang: Language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (
    value[lang] ?? value.en ?? value.tr ?? value.de ?? Object.values(value)[0] ?? ""
  );
}

export default function MenuPage({ menu, languages: providedLanguages }: Props) {
  const languages =
    providedLanguages && providedLanguages.length > 0
      ? providedLanguages
      : (["en", "tr", "de"] as Language[]);
  const [language, setLanguage] = useState<Language>(languages[0] ?? "en");

  const ingredientsLabel = {
    en: "Ingredients:",
    tr: "Malzemeler:",
    de: "Zutaten:",
  }[language];

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.languageSwitcher}>
          {languages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`${styles.languageButton} ${
                language === lang ? styles.languageButtonActive : ""
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.content}>
        {menu.categories.map((cat) => (
          <section key={cat.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {resolveText(cat.title, language)}
              </h2>
            </div>
            <div className={styles.items}>
              {cat.items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImageWrap}>
                    <Image
                      src={logo}
                      alt={`${resolveText(item.name, language)} placeholder`}
                      fill
                      sizes="140px"
                      className={styles.itemImage}
                    />
                  </div>
                  <div className={styles.itemBody}>
                    <p className={styles.itemName}>
                      {resolveText(item.name, language)}
                    </p>
                    {resolveText(item.description, language) && (
                      <p className={styles.itemDescription}>
                        {resolveText(item.description, language)}
                      </p>
                    )}
                    {item.ingredients && item.ingredients.length > 0 && (
                      <div className={styles.itemIngredients}>
                        <span className={styles.ingredientsLabel}>
                          {ingredientsLabel}
                        </span>
                        <div className={styles.ingredientsList}>
                          {item.ingredients.map((ing, idx) => (
                            <span key={idx} className={styles.ingredientPill}>
                              {resolveText(ing, language)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.itemPrice}>
                    €{item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {menu.categories.length === 0 && (
          <div className={styles.section}>
            <p>No menu items available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const token = ctx.params?.token as string;
  const db = await getDb();

  const tokenDoc = await db
    .collection("public_tokens")
    .findOne({ token, active: true });

  if (!tokenDoc) return { notFound: true };

  const venue = await db
    .collection("venues")
    .findOne({ _id: new ObjectId(tokenDoc.venueId) });
  if (!venue) return { notFound: true };

  const languages = Array.isArray(venue.langs) ? venue.langs : ["en", "tr", "de"];

  return {
    props: {
      token,
      venueName: venue.name,
      menu: venue.menu,
      languages,
    },
  };
};
