import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrash,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import { Category, MenuItem, LocalizedText } from "@/types/menu";
import styles from "@/styles/menu/menu.module.scss";

type Language = string;

function resolveText(
  value: MenuItem["name"] | MenuItem["description"] | LocalizedText,
  lang: Language
) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (
    value[lang] ?? value.en ?? value.tr ?? value.de ?? Object.values(value)[0] ?? ""
  );
}

type ItemCardProps = {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  language: Language;
  t: (key: string) => string;
};

function ItemCard({ item, onEdit, onDelete, language, t }: ItemCardProps) {
  const displayName = resolveText(item.name, language);
  const displayDescription = resolveText(item.description, language);

  return (
    <div className={styles.itemCard}>
      <div className={styles.itemInfo}>
        <b>{displayName}</b>
        {displayDescription ? (
          <div className={styles.itemDescription}>{displayDescription}</div>
        ) : null}
        {item.ingredients && item.ingredients.length > 0 ? (
          <div className={styles.itemIngredients}>
            {item.ingredients.map((ing, idx) => (
              <span key={idx} className={styles.ingredientPill}>
                {resolveText(ing, language)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
          <div className={styles.itemMeta}>
            <div>€{item.price.toFixed(2)}</div>
            <div className={styles.itemActions}>
              <button
                onClick={onEdit}
                className={`${styles.btn} ${styles.btnSubtleDark} ${styles.btnIcon}`}
                aria-label="Edit item"
              >
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button
                onClick={onDelete}
                className={`${styles.btn} ${styles.btnDanger} ${styles.btnIcon}`}
                aria-label={t("owner.item.delete")}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
    </div>
  );
}

type CategoryCardProps = {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  onAddItem: () => void;
  onRename: () => void;
  onDelete: () => void;
  onEditItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  language: Language;
  t: (key: string) => string;
};

export function CategoryCard({
  category,
  isExpanded,
  onToggle,
  onAddItem,
  onRename,
  onDelete,
  onEditItem,
  onDeleteItem,
  language,
  t,
}: CategoryCardProps) {
  const displayTitle = resolveText(category.title, language);

  return (
    <div
      className={`${styles.categoryCard} ${
        isExpanded ? styles.categoryCardExpanded : ""
      }`}
    >
      <div className={styles.categoryHeader}>
        <button onClick={onToggle} className={styles.categoryToggle}>
          <span
            className={`${styles.chevron} ${
              isExpanded ? styles.chevronExpanded : ""
            }`}
            aria-hidden
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </span>
          {displayTitle}
        </button>
        {isExpanded && (
          <div className={styles.categoryActions}>
            <button
              onClick={onAddItem}
              className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSmall}`}
            >
              {t("owner.category.addItem")}
            </button>
            <button
              onClick={onRename}
              className={`${styles.btn} ${styles.btnSubtleDark} ${styles.btnSmall}`}
            >
              {t("owner.category.rename")}
            </button>
            <button
              onClick={onDelete}
              className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
            >
              {t("owner.category.delete")}
            </button>
          </div>
        )}
      </div>

      <div
        className={`${styles.expandable} ${
          isExpanded ? styles.expandableOpen : ""
        }`}
        aria-hidden={!isExpanded}
      >
        {isExpanded && (
          <div className={styles.itemsSection}>
            {category.items.length === 0 && (
              <div className={styles.itemsEmpty}>
                {t("owner.category.empty")}
              </div>
            )}

            {category.items.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                onEdit={() => onEditItem(it.id)}
                onDelete={() => onDeleteItem(it.id)}
                language={language}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
