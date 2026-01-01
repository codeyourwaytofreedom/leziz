import { GetServerSideProps } from "next";

import Layout from "@/layout/layout";
import { getSession } from "@/lib/session";

type HomeProps = {
  isLoggedIn: boolean;
};

export default function Home({ isLoggedIn }: HomeProps) {
  return (
    <Layout isLoggedIn={isLoggedIn}>
      <h1>Hello My SaaS</h1>
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
