import Image from "next/image";
import { GetServerSideProps } from "next";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import styles from "@/styles/publicMenu.module.scss";
import { Menu } from "@/types/menu";
import logo from "@/assets/leziz-logo.png";

type Props = {
  venueName: string;
  menu: Menu;
};

export default function MenuPage({ venueName, menu }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {menu.categories.map((cat) => (
          <section key={cat.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{cat.title}</h2>
            </div>
            <div className={styles.items}>
                {cat.items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.itemImageWrap}>
                      <Image
                        src={logo}
                        alt={`${item.name} placeholder`}
                        fill
                        sizes="96px"
                        className={styles.itemImage}
                      />
                    </div>
                    <div>
                      <p className={styles.itemName}>{item.name}</p>
                      {item.description && (
                        <p className={styles.itemDescription}>
                          {item.description}
                      </p>
                    )}
                  </div>
                  <div className={styles.itemPrice}>
                    €{item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {menu.categories.length === 0 && (
          <div className={styles.section}>
            <p>No menu items available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
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

  return {
    props: {
      token,
      venueName: venue.name,
      menu: venue.menu,
    },
  };
};
