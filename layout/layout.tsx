import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faRightFromBracket,
  faRightToBracket,
  faUtensils,
  faMoneyBillWave,
  faList,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import styles from "./layout.module.scss";
import logo from "@/assets/lzz.png";
import { useI18n } from "@/lib/i18n";

type LayoutProps = {
  children: ReactNode;
  showLogin?: boolean;
  isLoggedIn?: boolean;
  venueName?: string;
  role?: string | null;
};

export default function Layout({
  children,
  showLogin = true,
  isLoggedIn = false,
  venueName,
  role,
}: LayoutProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { t, locale, setLocale } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  type NavRole = "guest" | "owner" | "bigboss";
  type NavAction = "login" | "profileDropdown" | "logoutButton";

  const navRole: NavRole =
    role === "bigboss" ? "bigboss" : isLoggedIn ? "owner" : "guest";

  const navActions: NavAction[] =
    navRole === "bigboss"
      ? ["profileDropdown"]
      : navRole === "owner"
      ? ["profileDropdown"]
      : showLogin
      ? ["login"]
      : [];

  const isActive = (href: string) =>
    router.pathname === href ||
    (href !== "/" && router.pathname.startsWith(href));

  const shouldShowLogin = showLogin && !isLoggedIn;
  const shouldShowOwnerLinks = isLoggedIn;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
      if (menuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [langOpen, profileOpen, menuOpen]);

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
            <div
              className={`${styles.dropdownStack} ${styles.menuStack}`}
              ref={menuRef}
            >
              <button
                type="button"
                className={styles.navIconButton}
                aria-label="Menu list"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <FontAwesomeIcon
                  icon={faList}
                  className={styles.btnIconInline}
                />
              </button>
              {menuOpen && (
                <div className={styles.langMenu} role="menu">
                  <Link
                    prefetch
                    href="/pricing"
                    className={styles.langMenuItem}
                    onClick={() => setMenuOpen(false)}
                  >
                    <FontAwesomeIcon icon={faMoneyBillWave} />
                    <span>{t("nav.pricing")}</span>
                  </Link>
                  {!isLoggedIn && (
                    <Link
                      prefetch
                      href="/login"
                      className={styles.langMenuItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <FontAwesomeIcon icon={faRightToBracket} />
                      <span>{t("nav.login")}</span>
                    </Link>
                  )}
                  {shouldShowOwnerLinks && (
                    <Link
                      prefetch
                      href="/owner/menu"
                      className={styles.langMenuItem}
                      onClick={() => setMenuOpen(false)}
                    >
                      <FontAwesomeIcon icon={faUtensils} />
                      <span>{t("nav.menu")}</span>
                    </Link>
                  )}
                  {navRole !== "guest" && (
                    <button
                      type="button"
                      className={styles.langMenuItem}
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} />
                      <span>{t("nav.logout")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <Link
              prefetch
              href="/pricing"
              className={isActive("/pricing") ? styles.active : undefined}
            >
              <FontAwesomeIcon
                icon={faMoneyBillWave}
                className={styles.btnIconInline}
              />
              <span className={styles.pricingLabel}> {t("nav.pricing")}</span>
            </Link>
            <div className={styles.dropdownStack}>
              {navActions.map((action) => {
                if (action === "login") {
                  return (
                    <Link
                      key="login"
                      prefetch
                      href="/login"
                      className={`${styles.navLogin} ${
                        isActive("/login") ? styles.active : ""
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={faRightToBracket}
                        className={styles.btnIconInline}
                      />
                      <span className={styles.loginLabel}>
                        {" "}
                        {t("nav.login")}
                      </span>
                    </Link>
                  );
                }

                if (action === "logoutButton") {
                  return (
                    <button
                      key="logout"
                      type="button"
                      className={styles.langDropdownToggle}
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} />
                      <span className={styles.langLabel}>{t("nav.logout")}</span>
                    </button>
                  );
                }

                // profileDropdown
                const profileLabel =
                  navRole === "bigboss"
                    ? "Big Boss"
                    : venueName
                    ? venueName
                    : "Profile";
                return (
                  <div
                    key="profile"
                    className={`${styles.langSwitch} ${styles.profileStack}`}
                    ref={profileRef}
                  >
                    <button
                      type="button"
                      className={styles.profileDropdownToggle}
                    aria-label="Profile"
                    onClick={() => setProfileOpen((o) => !o)}
                    aria-haspopup="true"
                    aria-expanded={profileOpen}
                  >
                    <FontAwesomeIcon
                      icon={navRole === "bigboss" ? faCrown : faUser}
                      className={styles.btnIconInline}
                    />
                    <span className={styles.langLabel}>
                      {profileLabel}
                    </span>
                  </button>
                    {profileOpen && (
                      <div
                        className={`${styles.langMenu} ${styles.profileMenu}`}
                        role="menu"
                      >
                        {navRole !== "bigboss" && (
                          <Link
                            prefetch
                            href="/owner/menu"
                            className={styles.langMenuItem}
                            onClick={() => setProfileOpen(false)}
                          >
                            <FontAwesomeIcon icon={faUtensils} />
                            <span>{t("nav.menu")}</span>
                          </Link>
                        )}
                        {navRole === "bigboss" && (
                          <Link
                            prefetch
                            href="/bigboss"
                            className={styles.langMenuItem}
                            onClick={() => setProfileOpen(false)}
                          >
                            <FontAwesomeIcon icon={faCrown} />
                            <span>Bigboss</span>
                          </Link>
                        )}
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
                );
              })}
              <div className={styles.langSwitch} ref={langRef}>
                <button
                  type="button"
                  onClick={() => setLangOpen((o) => !o)}
                  className={styles.langDropdownToggle}
                  aria-haspopup="true"
                  aria-expanded={langOpen}
                >
                  <span className={styles.langFlag}>
                    {locale === "de"
                      ? "🇩🇪"
                      : locale === "tr"
                      ? "🇹🇷"
                      : "🇬🇧"}
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
                      <span>{t("nav.language.en")}</span>
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
                      <span>{t("nav.language.de")}</span>
                      {locale === "de" && (
                        <span className={styles.langCheck}>✔</span>
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.langMenuItem}
                      onClick={() => {
                        setLocale("tr");
                        setLangOpen(false);
                      }}
                    >
                      <span className={styles.langFlag}>🇹🇷</span>
                      <span>{t("nav.language.tr")}</span>
                      {locale === "tr" && (
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
