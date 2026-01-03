import Layout from "@/layout/layout";
import { getSession } from "@/lib/session";
import type { GetServerSideProps } from "next";

export default function BigBossPage() {
  return (
    <Layout isLoggedIn showLogin={false} role="bigboss">
      <div style={{ padding: "2rem 0" }}>
        <h1>Hello, boss.</h1>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = getSession(ctx.req);
  if (!session || session.role !== "bigboss") {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
};
