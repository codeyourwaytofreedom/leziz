import Image from "next/image";
import { GetServerSideProps } from "next";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import styles from "@/styles/publicMenu.module.scss";
import { Menu, MenuItem } from "@/types/menu";
import logo from "@/assets/leziz-logo.png";

type Props = {
  menu: Menu;
};

function resolveText(value?: MenuItem["name"] | MenuItem["description"]) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.en ?? value.tr ?? value.de ?? Object.values(value)[0] ?? "";
}

export default function MenuPage({ menu }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {menu.categories.map((cat) => (
          <section key={cat.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{resolveText(cat.title)}</h2>
            </div>
            <div className={styles.items}>
              {cat.items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImageWrap}>
                    <Image
                      src={logo}
                      alt={`${resolveText(item.name)} placeholder`}
                      fill
                      sizes="140px"
                      className={styles.itemImage}
                    />
                  </div>
                  <div className={styles.itemBody}>
                    <p className={styles.itemName}>{resolveText(item.name)}</p>
                    {resolveText(item.description) && (
                      <p className={styles.itemDescription}>
                        {resolveText(item.description)}
                      </p>
                    )}
                    {item.ingredients && item.ingredients.length > 0 && (
                      <div className={styles.itemIngredients}>
                        <span className={styles.ingredientsLabel}>
                          Ingredients:
                        </span>
                        <div className={styles.ingredientsList}>
                          {item.ingredients.map((ing) => (
                            <span key={ing} className={styles.ingredientPill}>
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
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
