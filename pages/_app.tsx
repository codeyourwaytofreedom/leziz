import "@/styles/globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { AppProps } from "next/app";
import { Roboto } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
import { ToastProvider } from "@/lib/toast";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

config.autoAddCss = false;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={roboto.className}>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </main>
  );
}
