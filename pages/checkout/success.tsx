import Layout from "@/layout/layout";

export default function CheckoutSuccess() {
  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>Payment successful</h1>
        <p>Your subscription is active. You can now manage your menu.</p>
      </div>
    </Layout>
  );
}
