import Image, { StaticImageData } from "next/image";
import { GetServerSideProps } from "next";
import { useEffect, useRef, useState } from "react";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import styles from "@/styles/publicMenu.module.scss";
import { LocalizedText, Menu } from "@/types/menu";
import logo from "@/assets/lzz.png";
import fastFoodImg from "@/assets/menuHeaders/fast-food.jpg";
import bbqWingsImg from "@/assets/menuHeaders/bbq-wings.jpg";
import berryDonutImg from "@/assets/menuHeaders/berry-donut.jpg";
import pestoPenneImg from "@/assets/menuHeaders/pesto-penne.jpg";
import salmonPokeImg from "@/assets/menuHeaders/salmon-poke.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";

type Props = {
  menu: Menu;
  languages: string[];
  withImages: boolean;
  menuBackgroundColor?: string;
  currency?: string;
  menuImage?: string | null;
};

type Language = string;

function resolveText(value: LocalizedText | undefined, lang: Language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (
    value[lang] ??
    value.en ??
    value.tr ??
    value.de ??
    Object.values(value)[0] ??
    ""
  );
}

function formatTitle(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function MenuPage({
  menu,
  languages: providedLanguages,
  withImages,
  menuBackgroundColor,
  currency,
  menuImage,
}: Props) {
  const languages =
    providedLanguages && providedLanguages.length > 0
      ? providedLanguages
      : (["en", "tr", "de"] as Language[]);
  const [language, setLanguage] = useState<Language>(languages[0] ?? "en");
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries((menu.categories || []).map((c) => [c.id, false])) ||
      {}
  );
  const currencySymbol = currency || "€";

  const ingredientsLabel = {
    en: "Ingredients",
    tr: "Malzemeler",
    de: "Zutaten",
  }[language];

  const bgColor = menuBackgroundColor || "#0f172a";
  const headerMap: Record<string, StaticImageData> = {
    fastFood: fastFoodImg,
    bbqWings: bbqWingsImg,
    berryDonut: berryDonutImg,
    pestoPenne: pestoPenneImg,
    salmonPoke: salmonPokeImg,
  };
  const headerImg = headerMap[menuImage || ""] || fastFoodImg;

  function isLight(hex: string) {
    const parsed = hex.replace("#", "");
    if (parsed.length !== 6) return false;
    const r = parseInt(parsed.slice(0, 2), 16);
    const g = parseInt(parsed.slice(2, 4), 16);
    const b = parseInt(parsed.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.7;
  }

  const isLightBg = isLight(bgColor);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langOpen && langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [langOpen]);

  useEffect(() => {
    // safe: only sync open state when category list changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenCategories(
      Object.fromEntries((menu.categories || []).map((c) => [c.id, false]))
    );
  }, [menu.categories]);

  return (
    <div
      className={`${styles.page} ${
        isLightBg ? styles.pageLight : styles.pageDark
      }`}
      style={{ background: bgColor }}
    >
      <div className={styles.phoneShell}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneScreen}>
            <div className={styles.content}>
              <div className={styles.redBanner} aria-hidden="true">
                <Image
                  src={headerImg}
                  alt="Menu header"
                  fill
                  sizes="780px"
                  className={styles.redBannerImage}
                  priority
                />
                <div className={styles.topBar}>
                  {menuBackgroundColor && (
                    <div
                      className={styles.colorBadge}
                      style={{ backgroundColor: menuBackgroundColor }}
                      title={`Background: ${menuBackgroundColor}`}
                    />
                  )}
                  <div className={styles.languageDropdown} ref={langRef}>
                    <button
                      type="button"
                      className={styles.langToggle}
                      onClick={() => setLangOpen((o) => !o)}
                      aria-haspopup="true"
                      aria-expanded={langOpen}
                    >
                      <span className={styles.langFlag}>
                        {language.toUpperCase()}
                      </span>
                      <span className={styles.langCaret}>▾</span>
                    </button>
                    {langOpen && (
                      <div className={styles.langMenu} role="menu">
                        {languages.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            className={`${styles.langOption} ${
                              language === lang ? styles.langOptionActive : ""
                            }`}
                            onClick={() => {
                              setLanguage(lang);
                              setLangOpen(false);
                            }}
                          >
                            <span>{lang.toUpperCase()}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {menu.categories.map((cat) => (
                <section key={cat.id} className={styles.section}>
                  <button
                    type="button"
                    className={styles.sectionHeader}
                    onClick={() =>
                      setOpenCategories((prev) => ({
                        ...prev,
                        [cat.id]: !(prev[cat.id] ?? true),
                      }))
                    }
                    aria-expanded={openCategories[cat.id] ?? false}
                  >
                    <h2 className={styles.sectionTitle}>
                      {formatTitle(resolveText(cat.title, language))}
                    </h2>
                    <span className={styles.catToggle}>
                      <FontAwesomeIcon
                        icon={
                          (openCategories[cat.id] ?? false)
                            ? faChevronDown
                            : faChevronRight
                        }
                      />
                    </span>
                  </button>
                  {(openCategories[cat.id] ?? true) && (
                    <div className={styles.items}>
                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          className={`${styles.item} ${
                            !withImages ? styles.itemNoImage : ""
                          }`}
                        >
                          {withImages && (
                            <div className={styles.itemImageWrap}>
                              <Image
                                src={logo}
                                alt={`${resolveText(item.name, language)} placeholder`}
                                fill
                                sizes="140px"
                                className={styles.itemImage}
                              />
                            </div>
                          )}
                          <div className={styles.itemBody}>
                            <p className={styles.itemName}>
                              {resolveText(item.name, language)}
                            </p>
                            {item.size && resolveText(item.size, language) && (
                              <span className={styles.itemSize}>
                                {resolveText(item.size, language)}
                              </span>
                            )}
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
                            {currencySymbol}
                            {item.price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}

              {menu.categories.length === 0 && (
                <div className={styles.section}>
                  <p>No menu items available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
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

  const languages = Array.isArray(venue.langs)
    ? venue.langs
    : ["en", "tr", "de"];

  return {
    props: {
      token,
      venueName: venue.name,
      menu: venue.menu,
      languages,
      withImages: venue.menuConfig?.withImages !== false,
      menuBackgroundColor: venue.menuConfig?.menuBackgroundColor ?? undefined,
      currency: venue.menuConfig?.currency ?? "€",
      menuImage: venue.menuConfig?.menuImage ?? null,
    },
  };
};
