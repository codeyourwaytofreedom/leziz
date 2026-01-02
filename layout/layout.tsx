import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode, useState } from "react";

import styles from "./layout.module.scss";
import logo from "@/assets/leziz-logo.png";

type LayoutProps = {
  children: ReactNode;
  showLogin?: boolean;
  isLoggedIn?: boolean;
};

export default function Layout({
  children,
  showLogin = true,
  isLoggedIn = false,
}: LayoutProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) =>
    router.pathname === href ||
    (href !== "/" && router.pathname.startsWith(href));

  const shouldShowLogin = showLogin && !isLoggedIn;
  const shouldShowOwnerLinks = isLoggedIn;

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
              width={48}
              height={48}
              priority
            />
            <span className={styles.brandText}>Leziz</span>
          </Link>
          <div className={styles.links}>
            <Link
              prefetch
              href="/"
              className={isActive("/") ? styles.active : undefined}
            >
              Home
            </Link>
            {shouldShowOwnerLinks && (
              <>
                <Link
                  prefetch
                  href="/owner/menu"
                  className={
                    isActive("/owner/menu") ? styles.active : undefined
                  }
                >
                  Owner Menu
                </Link>
                <Link
                  prefetch
                  href="/owner/qr"
                  className={
                    isActive("/owner/qr") ? styles.active : undefined
                  }
                >
                  Owner QR
                </Link>
              </>
            )}
            {shouldShowLogin && (
              <Link
                prefetch
                href="/login"
                className={isActive("/login") ? styles.active : undefined}
              >
                Login
              </Link>
            )}
            {isLoggedIn && (
              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            )}
          </div>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
