import Layout from "@/layout/layout";
import { useI18n } from "@/lib/i18n";

export default function CheckoutSuccess() {
  const { t } = useI18n();
  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>{t("checkout.success.title")}</h1>
        <p>{t("checkout.success.body")}</p>
      </div>
    </Layout>
  );
}
