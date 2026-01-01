import Image from "next/image";
import type { GetServerSideProps } from "next";
import QRCode from "qrcode";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import Layout from "@/layout/layout";

type Props = {
  url: string;
  qrDataUrl: string;
  venueName: string;
};

export default function OwnerQrPage({ url, qrDataUrl, venueName }: Props) {
  return (
    <Layout isLoggedIn showLogin={false}>
      <main style={{ padding: 24 }}>
        <h1>QR – {venueName}</h1>
        <p>{url}</p>

        <Image src={qrDataUrl} alt="QR" width={300} height={300} />
      </main>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = getSession(ctx.req);

  if (!session) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const db = await getDb();

  // token for this owner’s venue
  const tokenDoc = await db.collection("public_tokens").findOne({
    venueId: session.venueId,
    active: true,
  });

  if (!tokenDoc) return { notFound: true };

  const venue = await db.collection("venues").findOne({
    _id: new ObjectId(session.venueId),
  });

  if (!venue) return { notFound: true };

  // IMPORTANT: your public route is /m/<token> (not /menu/<token>)
  const url = `${
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }/menu/${tokenDoc.token}`;

  const qrDataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2 });

  return {
    props: {
      url,
      qrDataUrl,
      venueName: venue.name ?? "Venue",
    },
  };
};
