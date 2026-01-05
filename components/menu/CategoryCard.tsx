import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrash,
  faChevronRight,
  faArrowUp,
  faArrowDown,
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
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableMoveUp: boolean;
  disableMoveDown: boolean;
  isHighlighted: boolean;
  language: Language;
  t: (key: string) => string;
};

function ItemCard({
  item,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown,
  isHighlighted,
  language,
  t,
}: ItemCardProps) {
  const displayName = resolveText(item.name, language);
  const displayDescription = resolveText(item.description, language);
  const displaySize = item.size ? resolveText(item.size, language) : "";

  return (
    <div
      className={`${styles.itemCard} ${
        isHighlighted ? styles.itemCardHighlight : ""
      }`}
    >
      <div className={styles.itemInfo}>
        <b>{displayName}</b>
        {displaySize ? (
          <div className={styles.itemSize}>{displaySize}</div>
        ) : null}
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
                onClick={onMoveUp}
                className={`${styles.btn} ${styles.btnSubtleDark} ${styles.btnIcon}`}
                aria-label="Move item up"
                disabled={disableMoveUp}
              >
                <FontAwesomeIcon icon={faArrowUp} />
              </button>
              <button
                onClick={onMoveDown}
                className={`${styles.btn} ${styles.btnSubtleDark} ${styles.btnIcon}`}
                aria-label="Move item down"
                disabled={disableMoveDown}
              >
                <FontAwesomeIcon icon={faArrowDown} />
              </button>
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
  onMoveItem: (itemId: string, direction: "up" | "down") => void;
  onEditItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  highlightItemId?: string;
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
  onMoveItem,
  onEditItem,
  onDeleteItem,
  highlightItemId,
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

            {category.items.map((it, idx) => (
              <ItemCard
                key={it.id}
                item={it}
                onEdit={() => onEditItem(it.id)}
                onDelete={() => onDeleteItem(it.id)}
                onMoveUp={() => onMoveItem(it.id, "up")}
                onMoveDown={() => onMoveItem(it.id, "down")}
                disableMoveUp={idx === 0}
                disableMoveDown={idx === category.items.length - 1}
                isHighlighted={highlightItemId === it.id}
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
