import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightFromBracket,
  faRightToBracket,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./layout.module.scss";
import logo from "@/assets/lzz.png";
import { useI18n } from "@/lib/i18n";

type LayoutProps = {
  children: ReactNode;
  showLogin?: boolean;
  isLoggedIn?: boolean;
  venueName?: string;
};

export default function Layout({
  children,
  showLogin = true,
  isLoggedIn = false,
  venueName,
}: LayoutProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { t, locale, setLocale } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const isActive = (href: string) =>
    router.pathname === href ||
    (href !== "/" && router.pathname.startsWith(href));

  const shouldShowLogin = showLogin && !isLoggedIn;
  const shouldShowOwnerLinks = isLoggedIn;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (langOpen && langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
      }
      if (
        profileOpen &&
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [langOpen, profileOpen]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Logout failed");
      await router.push("/");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className={styles.appLayout}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/" className={styles.brand}>
            <Image
              src={logo}
              alt="Leziz logo"
              className={styles.brandLogo}
              width={150}
              height={96}
              priority
            />
          </Link>
          <div className={styles.links}>
            {shouldShowLogin && (
              <Link
                prefetch
                href="/login"
                className={isActive("/login") ? styles.active : undefined}
              >
                <FontAwesomeIcon
                  icon={faRightToBracket}
                  className={styles.btnIconInline}
                />{" "}
                {t("nav.login")}
              </Link>
            )}
            <div className={styles.dropdownStack}>
              {isLoggedIn && (
                <div className={styles.langSwitch} ref={profileRef}>
                  <button
                    type="button"
                    className={styles.langDropdownToggle}
                    aria-label="Profile"
                    onClick={() => setProfileOpen((o) => !o)}
                    aria-haspopup="true"
                    aria-expanded={profileOpen}
                  >
                    <span className={styles.langLabel}>
                      {venueName ? venueName : "Profile"}
                    </span>
                    <span className={styles.langCaret}>▾</span>
                  </button>
                  {profileOpen && (
                    <div
                      className={`${styles.langMenu} ${styles.profileMenu}`}
                      role="menu"
                    >
                      <Link
                        prefetch
                        href="/owner/menu"
                        className={styles.langMenuItem}
                        onClick={() => setProfileOpen(false)}
                      >
                        <FontAwesomeIcon icon={faUtensils} />
                        <span>{t("nav.menu")}</span>
                      </Link>
                      <button
                        type="button"
                        className={styles.langMenuItem}
                        onClick={handleLogout}
                        disabled={loggingOut}
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} />
                        <span>{t("nav.logout")}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className={styles.langSwitch} ref={langRef}>
                <button
                  type="button"
                  onClick={() => setLangOpen((o) => !o)}
                  className={styles.langDropdownToggle}
                  aria-haspopup="true"
                  aria-expanded={langOpen}
                >
                  <span className={styles.langFlag}>
                    {locale === "de" ? "🇩🇪" : "🇬🇧"}
                  </span>
                  <span className={styles.langCaret}>▾</span>
                </button>
                {langOpen && (
                  <div
                    className={`${styles.langMenu} ${styles.langMenuLang}`}
                    role="menu"
                  >
                    <button
                      type="button"
                      className={styles.langMenuItem}
                      onClick={() => {
                        setLocale("en");
                        setLangOpen(false);
                      }}
                    >
                      <span className={styles.langFlag}>🇬🇧</span>
                      <span>English</span>
                      {locale === "en" && (
                        <span className={styles.langCheck}>✔</span>
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.langMenuItem}
                      onClick={() => {
                        setLocale("de");
                        setLangOpen(false);
                      }}
                    >
                      <span className={styles.langFlag}>🇩🇪</span>
                      <span>Deutsch</span>
                      {locale === "de" && (
                        <span className={styles.langCheck}>✔</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
