import { GetServerSideProps } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import QRCode from "qrcode";

import { getSession } from "@/lib/session";
import Layout from "@/layout/layout";
import { useToast } from "@/lib/toast";
import { CategoryCard } from "@/components/menu/CategoryCard";
import { Modal } from "@/components/menu/Modal";
import styles from "@/styles/menu/menu.module.scss";
import { Category, Menu, MenuItem, LocalizedText } from "@/types/menu";

type Language = string;

type Props = {
  venueId: string; // ObjectId as string
  venueName: LocalizedText;
  menu: Menu;
  languages: Language[];
  qrUrl?: string;
  qrDataUrl?: string;
};

function uid(prefix = "id") {
  // simple unique id for UI-created objects
  return `${prefix}_${Math.random()
    .toString(16)
    .slice(2)}_${Date.now().toString(16)}`;
}

function resolveText(value: LocalizedText | undefined, lang: Language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (
    value[lang] ??
    value.en ??
    value.tr ??
    value.de ??
    Object.values(value)[0] ??
    ""
  );
}

function setLocalized(
  value: LocalizedText | undefined,
  lang: Language,
  text: string
): LocalizedText | undefined {
  const nextText = text.trim();
  const base = typeof value === "string" ? {} : value ?? {};

  if (!nextText) {
    const { [lang]: _removed, ...rest } = base;
    return Object.keys(rest).length ? rest : undefined;
  }

  return { ...base, [lang]: nextText };
}

function toLocalizedArray(
  current: LocalizedText[] | undefined,
  lang: Language,
  raw: string
): LocalizedText[] | undefined {
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return undefined;
  return parts.map(
    (part, idx) => setLocalized(current?.[idx], lang, part) ?? part
  );
}

function buildIngredientsFromAllLanguages(
  perLanguage: Record<string, string>,
  languages: Language[]
): LocalizedText[] | undefined {
  const splitByLang = languages.map((lang) => ({
    lang,
    parts: (perLanguage[lang] ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean),
  }));

  const maxLen = splitByLang.reduce(
    (max, entry) => Math.max(max, entry.parts.length),
    0
  );
  if (maxLen === 0) return undefined;

  const result: LocalizedText[] = [];
  for (let i = 0; i < maxLen; i++) {
    const entry: Record<string, string> = {};
    splitByLang.forEach(({ lang, parts }) => {
      if (parts[i]) entry[lang] = parts[i];
    });
    if (Object.keys(entry).length > 0) result.push(entry);
  }
  return result.length ? result : undefined;
}

export default function OwnerMenuPage({
  venueId,
  venueName: initialVenueName,
  menu: initialMenu,
  languages: providedLanguages,
  qrUrl,
  qrDataUrl,
}: Props) {
  const languages =
    providedLanguages && providedLanguages.length > 0
      ? providedLanguages
      : (["en", "tr", "de"] as Language[]);
  const [language, setLanguage] = useState<Language>(languages[0] ?? "en");
  const [venueName, setVenueName] = useState(() =>
    resolveText(initialVenueName, languages[0] ?? "en")
  );
  const [menu, setMenu] = useState<Menu>(initialMenu);
  const [hasChanges, setHasChanges] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const toast = useToast();

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    null
  );

  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameTranslations, setRenameTranslations] = useState<
    Record<string, string>
  >({});
  const [renameVisible, setRenameVisible] = useState(false);
  const [addTarget, setAddTarget] = useState<{ catId: string } | null>(null);
  const [addValues, setAddValues] = useState<{
    names: Record<string, string>;
    price: string;
    descriptions: Record<string, string>;
    ingredients: Record<string, string>;
  }>({ names: {}, price: "", descriptions: {}, ingredients: {} });
  const [addLanguageTab, setAddLanguageTab] = useState<Language>(
    languages[0] ?? "en"
  );
  const [addVisible, setAddVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    catId: string;
    itemId: string;
  } | null>(null);
  const [editValues, setEditValues] = useState<{
    names: Record<string, string>;
    price: string;
    descriptions: Record<string, string>;
    ingredients: Record<string, string>;
  }>({ names: {}, price: "", descriptions: {}, ingredients: {} });
  const [editLanguageTab, setEditLanguageTab] = useState<Language>(
    languages[0] ?? "en"
  );
  const [editVisible, setEditVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    catId: string;
    itemId: string;
    name: string;
  } | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryVisible, setNewCategoryVisible] = useState(false);
  const [newCategoryTranslations, setNewCategoryTranslations] = useState<
    Record<string, string>
  >({});
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<{
    catId: string;
    title: string;
  } | null>(null);
  const [deleteCategoryVisible, setDeleteCategoryVisible] = useState(false);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState("");

  function addCategory() {
    setNewCategoryTranslations({});
    setNewCategoryOpen(true);
  }

  function renameCategory(catId: string) {
    const cat = menu.categories.find((c) => c.id === catId);
    if (!cat) return;
    const displayTitle = resolveText(cat.title, language);
    setRenameTarget({ id: catId, name: displayTitle });
    const base = typeof cat.title === "string" ? {} : cat.title ?? {};
    const nextTranslations = languages.reduce<Record<string, string>>(
      (acc, lang) => {
        const val =
          typeof cat.title === "string"
            ? resolveText(cat.title, lang)
            : base[lang] ?? resolveText(cat.title, lang);
        if (val) acc[lang] = val;
        return acc;
      },
      {}
    );
    setRenameTranslations(nextTranslations);
  }

  function deleteCategory(catId: string) {
    const cat = menu.categories.find((c) => c.id === catId);
    if (!cat) return;
    setDeleteCategoryTarget({ catId, title: resolveText(cat.title, language) });
  }

  function addItem(catId: string) {
    setAddTarget({ catId });
    setAddValues({ names: {}, price: "", descriptions: {}, ingredients: {} });
    setAddLanguageTab(languages[0] ?? "en");
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addTarget) return;

    const nameTranslations = languages.reduce<Record<string, string>>(
      (acc, lang) => {
        const val = (addValues.names[lang] ?? "").trim();
        if (val) acc[lang] = val;
        return acc;
      },
      {}
    );
    if (Object.keys(nameTranslations).length !== languages.length) return;

    const price = Number(addValues.price);
    if (Number.isNaN(price)) return;

    const descriptionTranslations = languages.reduce<Record<string, string>>(
      (acc, lang) => {
        const val = (addValues.descriptions[lang] ?? "").trim();
        if (val) acc[lang] = val;
        return acc;
      },
      {}
    );
    const ingredients = buildIngredientsFromAllLanguages(
      addValues.ingredients,
      languages
    );

    const item: MenuItem = {
      id: uid("item"),
      name: nameTranslations,
      price,
      description:
        Object.keys(descriptionTranslations).length > 0
          ? descriptionTranslations
          : undefined,
      ingredients,
    };

    setMenu((m) => ({
      ...m,
      categories: m.categories.map((c) =>
        c.id === addTarget.catId ? { ...c, items: [...c.items, item] } : c
      ),
    }));
    setHasChanges(true);

    setAddVisible(false);
    setTimeout(() => {
      setAddTarget(null);
      setAddValues({ names: {}, price: "", descriptions: {}, ingredients: {} });
    }, 200);
  }

  function closeAdd() {
    setAddVisible(false);
    setTimeout(() => {
      setAddTarget(null);
      setAddValues({ names: {}, price: "", descriptions: {}, ingredients: {} });
    }, 200);
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget) return;

    const translations = languages.reduce<Record<string, string>>(
      (acc, lang) => {
        const val = (renameTranslations[lang] ?? "").trim();
        if (val) acc[lang] = val;
        return acc;
      },
      {}
    );
    if (Object.keys(translations).length !== languages.length) return;

    setMenu((m) => ({
      ...m,
      categories: m.categories.map((c) =>
        c.id === renameTarget.id ? { ...c, title: translations } : c
      ),
    }));
    setHasChanges(true);
    setRenameVisible(false);
    setTimeout(() => {
      setRenameTarget(null);
      setRenameTranslations({});
    }, 200);
  }

  function submitNewCategory(e: React.FormEvent) {
    e.preventDefault();
    const translations = languages.reduce<Record<string, string>>(
      (acc, lang) => {
        const val = (newCategoryTranslations[lang] ?? "").trim();
        if (val) acc[lang] = val;
        return acc;
      },
      {}
    );

    if (Object.keys(translations).length === 0) return;

    const newCat: Category = {
      id: uid("cat"),
      title: translations,
      items: [],
    };
    setMenu((m) => ({ ...m, categories: [...m.categories, newCat] }));
    setHasChanges(true);
    setExpandedCategoryId(newCat.id);
    setNewCategoryVisible(false);
    setTimeout(() => {
      setNewCategoryOpen(false);
      setNewCategoryTranslations({});
    }, 200);
  }

  function closeNewCategory() {
    setNewCategoryVisible(false);
    setTimeout(() => {
      setNewCategoryOpen(false);
      setNewCategoryTranslations({});
    }, 200);
  }

  function closeRename() {
    setRenameVisible(false);
    setTimeout(() => {
      setRenameTarget(null);
      setRenameTranslations({});
    }, 200);
  }

  useEffect(() => {
    if (renameTarget) {
      setRenameVisible(false);
      const id = requestAnimationFrame(() => setRenameVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setRenameVisible(false);
  }, [renameTarget]);

  useEffect(() => {
    if (editTarget) {
      setEditVisible(false);
      const id = requestAnimationFrame(() => setEditVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setEditVisible(false);
  }, [editTarget]);

  useEffect(() => {
    if (addTarget) {
      setAddVisible(false);
      const id = requestAnimationFrame(() => setAddVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setAddVisible(false);
  }, [addTarget]);

  useEffect(() => {
    if (deleteTarget) {
      setDeleteVisible(false);
      const id = requestAnimationFrame(() => setDeleteVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setDeleteVisible(false);
  }, [deleteTarget]);

  useEffect(() => {
    if (deleteCategoryTarget) {
      setDeleteCategoryVisible(false);
      const id = requestAnimationFrame(() => setDeleteCategoryVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setDeleteCategoryVisible(false);
  }, [deleteCategoryTarget]);

  useEffect(() => {
    if (newCategoryOpen) {
      setNewCategoryVisible(false);
      const id = requestAnimationFrame(() => setNewCategoryVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setNewCategoryVisible(false);
  }, [newCategoryOpen]);

  function editItem(catId: string, itemId: string) {
    const cat = menu.categories.find((c) => c.id === catId);
    const item = cat?.items.find((i) => i.id === itemId);
    if (!cat || !item) return;

    setEditTarget({ catId, itemId });
    setEditLanguageTab(language);

    const nameTranslations = languages.reduce<Record<string, string>>(
      (acc, lang) => {
        const val = resolveText(item.name, lang);
        if (val) acc[lang] = val;
        return acc;
      },
      {}
    );
    const descriptionTranslations = languages.reduce<Record<string, string>>(
      (acc, lang) => {
        const val = resolveText(item.description, lang);
        if (val) acc[lang] = val;
        return acc;
      },
      {}
    );

    const ingredientStrings: Record<string, string> = languages.reduce(
      (acc, lang) => {
        const val =
          item.ingredients
            ?.map((ing) => resolveText(ing, lang))
            .filter(Boolean)
            .join(", ") ?? "";
        return { ...acc, [lang]: val };
      },
      {}
    );

    setEditValues({
      names: nameTranslations,
      price: String(item.price),
      descriptions: descriptionTranslations,
      ingredients: ingredientStrings,
    });
  }

  function deleteItem(catId: string, itemId: string) {
    setMenu((m) => ({
      ...m,
      categories: m.categories.map((c) => {
        if (c.id !== catId) return c;
        return { ...c, items: c.items.filter((i) => i.id !== itemId) };
      }),
    }));
    setHasChanges(true);
  }

  function submitDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    deleteItem(deleteTarget.catId, deleteTarget.itemId);
    setDeleteVisible(false);
    setTimeout(() => {
      setDeleteTarget(null);
    }, 200);
  }

  function closeDelete() {
    setDeleteVisible(false);
    setTimeout(() => {
      setDeleteTarget(null);
    }, 200);
  }

  function submitDeleteCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteCategoryTarget) return;
    if (deleteCategoryConfirm.trim().toLowerCase() !== "delete") return;
    const catId = deleteCategoryTarget.catId;

    setMenu((m) => {
      const next = m.categories.filter((c) => c.id !== catId);
      return { ...m, categories: next };
    });
    setHasChanges(true);
    if (expandedCategoryId === catId) setExpandedCategoryId(null);

    setDeleteCategoryVisible(false);
    setTimeout(() => {
      setDeleteCategoryTarget(null);
      setDeleteCategoryConfirm("");
    }, 200);
  }

  function closeDeleteCategory() {
    setDeleteCategoryVisible(false);
    setTimeout(() => {
      setDeleteCategoryTarget(null);
      setDeleteCategoryConfirm("");
    }, 200);
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;

    const nameTranslations = languages.reduce<Record<string, string>>(
      (acc, lang) => {
        const val = (editValues.names[lang] ?? "").trim();
        if (val) acc[lang] = val;
        return acc;
      },
      {}
    );
    if (Object.keys(nameTranslations).length !== languages.length) return;

    const price = Number(editValues.price);
    if (Number.isNaN(price)) return;

    const descriptionTranslations = languages.reduce<Record<string, string>>(
      (acc, lang) => {
        const val = (editValues.descriptions[lang] ?? "").trim();
        if (val) acc[lang] = val;
        return acc;
      },
      {}
    );
    const currentItem = menu.categories
      .find((c) => c.id === editTarget.catId)
      ?.items.find((i) => i.id === editTarget.itemId);
    const ingredients = buildIngredientsFromAllLanguages(
      editValues.ingredients,
      languages
    );

    setMenu((m) => ({
      ...m,
      categories: m.categories.map((c) => {
        if (c.id !== editTarget.catId) return c;
        return {
          ...c,
          items: c.items.map((i) =>
            i.id === editTarget.itemId
              ? {
                  ...i,
                  name: nameTranslations,
                  price,
                  description:
                    Object.keys(descriptionTranslations).length > 0
                      ? descriptionTranslations
                      : undefined,
                  ingredients,
                }
              : i
          ),
        };
      }),
    }));
    setHasChanges(true);

    setEditVisible(false);
    setTimeout(() => {
      setEditTarget(null);
      setEditValues({
        names: {},
        price: "",
        descriptions: {},
        ingredients: {},
      });
    }, 200);
  }

  function closeEdit() {
    setEditVisible(false);
    setTimeout(() => {
      setEditTarget(null);
      setEditValues({
        names: {},
        price: "",
        descriptions: {},
        ingredients: {},
      });
    }, 200);
  }

  async function save() {
    try {
      const res = await fetch("/api/owner/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, venueName, menu }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.addToast("Saved", "success");
      setHasChanges(false);
    } catch {
      toast.addToast("Error saving menu", "error");
    }
  }

  return (
    <Layout isLoggedIn showLogin={false}>
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Edit Menu</h1>
          </div>
          {qrDataUrl && (
            <button
              type="button"
              className={styles.qrCard}
              onClick={() => setQrModalOpen(true)}
            >
              <Image
                src={qrDataUrl}
                alt="Menu QR code"
                className={styles.qrImage}
                width={80}
                height={80}
              />
            </button>
          )}
        </div>

        <div className={styles.topRow}>
          <div className={styles.venueRow}>
            <label className={styles.venueLabel} htmlFor="venueName">
              Venue name
            </label>
            <input
              id="venueName"
              value={venueName}
              onChange={(e) => {
                setVenueName(e.target.value);
                setHasChanges(true);
              }}
              className={styles.venueInput}
            />
          </div>
          <div className={styles.languageRow}>
            <div className={styles.languageSwitcher}>
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`${styles.btn} ${styles.languageButton} ${
                    language === lang ? styles.languageButtonActive : ""
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.venueRowMobile}>
          <label className={styles.venueLabel} htmlFor="venueName">
            Venue name
          </label>
          <input
            id="venueName"
            value={venueName}
            onChange={(e) => {
              setVenueName(e.target.value);
              setHasChanges(true);
            }}
            className={styles.venueInput}
          />
        </div>

        <section className={styles.section}>
          <div className={styles.headerRow}>
            <div className={styles.headerActions}>
              <button
                onClick={addCategory}
                className={`${styles.btn} ${styles.btnAccent} ${styles.btnSmall} ${styles.btnWide}`}
              >
                + New category
              </button>
              <button
                onClick={save}
                className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSmall}`}
                disabled={!hasChanges}
              >
                <FontAwesomeIcon
                  icon={faFloppyDisk}
                  aria-hidden
                  className={styles.btnIconInline}
                />{" "}
                Save
              </button>
            </div>
          </div>

          {menu.categories.length === 0 && (
            <div className={styles.emptyBox}>
              No categories yet. Click “+ Add”.
            </div>
          )}

          {menu.categories.map((c) => {
            const isExpanded = expandedCategoryId === c.id;
            return (
              <CategoryCard
                key={c.id}
                category={c}
                isExpanded={isExpanded}
                onToggle={() => setExpandedCategoryId(isExpanded ? null : c.id)}
                onAddItem={() => addItem(c.id)}
                onRename={() => renameCategory(c.id)}
                onDelete={() => deleteCategory(c.id)}
                onEditItem={(itemId) => editItem(c.id, itemId)}
                onDeleteItem={(itemId) => {
                  const item = c.items.find((i) => i.id === itemId);
                  setDeleteTarget({
                    catId: c.id,
                    itemId,
                    name: resolveText(item?.name, language) || "Item",
                  });
                }}
                language={language}
              />
            );
          })}
        </section>
      </div>

      <Modal
        isOpen={newCategoryOpen}
        isVisible={newCategoryVisible}
        title="Add category"
      >
        <form onSubmit={submitNewCategory} className={styles.modalForm}>
          <div className={styles.translationGrid}>
            {languages.map((lang, idx) => (
              <label key={lang} className={styles.modalLabel}>
                <span>{lang.toUpperCase()}</span>
                <input
                  value={newCategoryTranslations[lang] ?? ""}
                  onChange={(e) =>
                    setNewCategoryTranslations((prev) => ({
                      ...prev,
                      [lang]: e.target.value,
                    }))
                  }
                  className={styles.modalInput}
                  autoFocus={idx === 0}
                  required
                />
              </label>
            ))}
          </div>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={closeNewCategory}
              className={`${styles.btn} ${styles.btnSubtle} ${styles.btnSmall}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSmall}`}
            >
              Add
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(renameTarget)}
        isVisible={renameVisible}
        title="Rename category"
      >
        <form onSubmit={submitRename} className={styles.modalForm}>
          <div
            className={`${styles.translationGrid} ${styles.translationSection}`}
          >
            {languages.map((lang, idx) => (
              <label key={lang} className={styles.modalLabel}>
                <span>{lang.toUpperCase()}</span>
                <input
                  value={renameTranslations[lang] ?? ""}
                  onChange={(e) =>
                    setRenameTranslations((prev) => ({
                      ...prev,
                      [lang]: e.target.value,
                    }))
                  }
                  className={styles.modalInput}
                  autoFocus={idx === 0}
                  required
                />
              </label>
            ))}
          </div>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={closeRename}
              className={`${styles.btn} ${styles.btnSubtle} ${styles.btnSmall}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
            >
              Update
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editTarget)}
        isVisible={editVisible}
        title="Edit item"
      >
        <form onSubmit={submitEdit} className={styles.modalForm}>
          <div className={styles.translationTabs}>
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                className={`${styles.translationTab} ${
                  editLanguageTab === lang ? styles.translationTabActive : ""
                }`}
                onClick={() => setEditLanguageTab(lang)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <label className={styles.modalLabel}>
            <span>Name ({editLanguageTab.toUpperCase()})</span>
            <input
              value={editValues.names[editLanguageTab] ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({
                  ...v,
                  names: { ...v.names, [editLanguageTab]: e.target.value },
                }))
              }
              autoFocus
              className={styles.modalInput}
              required
            />
          </label>
          <label className={styles.modalLabel}>
            <span>Price</span>
            <input
              value={editValues.price}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, price: e.target.value }))
              }
              className={styles.modalInput}
              type="number"
              step="0.01"
              min="0"
              required
            />
          </label>
          <label className={styles.modalLabel}>
            <span>Description ({editLanguageTab.toUpperCase()})</span>
            <textarea
              value={editValues.descriptions[editLanguageTab] ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({
                  ...v,
                  descriptions: {
                    ...v.descriptions,
                    [editLanguageTab]: e.target.value,
                  },
                }))
              }
              className={styles.modalInput}
              rows={3}
            />
          </label>
          <label className={styles.modalLabel}>
            <span>
              Ingredients ({editLanguageTab.toUpperCase()}) (comma separated)
            </span>
            <textarea
              value={editValues.ingredients[editLanguageTab] ?? ""}
              onChange={(e) =>
                setEditValues((v) => ({
                  ...v,
                  ingredients: {
                    ...v.ingredients,
                    [editLanguageTab]: e.target.value,
                  },
                }))
              }
              className={styles.modalInput}
              rows={2}
              placeholder="e.g. tomato, basil, mozzarella"
            />
          </label>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={closeEdit}
              className={`${styles.btn} ${styles.btnSubtle} ${styles.btnSmall}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
            >
              Update
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(addTarget)}
        isVisible={addVisible}
        title="Add item"
      >
        <form onSubmit={submitAdd} className={styles.modalForm}>
          <div className={styles.translationTabs}>
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                className={`${styles.translationTab} ${
                  addLanguageTab === lang ? styles.translationTabActive : ""
                }`}
                onClick={() => setAddLanguageTab(lang)}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <label className={styles.modalLabel}>
            <span>Name ({addLanguageTab.toUpperCase()})</span>
            <input
              value={addValues.names[addLanguageTab] ?? ""}
              onChange={(e) =>
                setAddValues((v) => ({
                  ...v,
                  names: { ...v.names, [addLanguageTab]: e.target.value },
                }))
              }
              autoFocus
              className={styles.modalInput}
              required
            />
          </label>
          <label className={styles.modalLabel}>
            <span>Price</span>
            <input
              value={addValues.price}
              onChange={(e) =>
                setAddValues((v) => ({ ...v, price: e.target.value }))
              }
              className={styles.modalInput}
              type="number"
              step="0.01"
              min="0"
              required
            />
          </label>
          <label className={styles.modalLabel}>
            <span>Description ({addLanguageTab.toUpperCase()})</span>
            <textarea
              value={addValues.descriptions[addLanguageTab] ?? ""}
              onChange={(e) =>
                setAddValues((v) => ({
                  ...v,
                  descriptions: {
                    ...v.descriptions,
                    [addLanguageTab]: e.target.value,
                  },
                }))
              }
              className={styles.modalInput}
              rows={3}
            />
          </label>
          <label className={styles.modalLabel}>
            <span>
              Ingredients ({addLanguageTab.toUpperCase()}) (comma separated)
            </span>
            <textarea
              value={addValues.ingredients[addLanguageTab] ?? ""}
              onChange={(e) =>
                setAddValues((v) => ({
                  ...v,
                  ingredients: {
                    ...v.ingredients,
                    [addLanguageTab]: e.target.value,
                  },
                }))
              }
              className={styles.modalInput}
              rows={2}
              placeholder="e.g. tomato, basil, mozzarella"
            />
          </label>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={closeAdd}
              className={`${styles.btn} ${styles.btnSubtle} ${styles.btnSmall}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSmall}`}
            >
              Add
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        isVisible={deleteVisible}
        title="Delete item"
      >
        <form onSubmit={submitDelete} className={styles.modalForm}>
          <p>
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name}</strong>?
          </p>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={closeDelete}
              className={`${styles.btn} ${styles.btnSubtle} ${styles.btnSmall}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
            >
              Delete
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deleteCategoryTarget)}
        isVisible={deleteCategoryVisible}
        title="Delete category"
      >
        <form onSubmit={submitDeleteCategory} className={styles.modalForm}>
          <p>
            Are you sure you want to delete{" "}
            <strong>{deleteCategoryTarget?.title}</strong> and its items?
          </p>
          <label className={styles.modalLabel}>
            <span>Type DELETE to confirm</span>
            <input
              value={deleteCategoryConfirm}
              onChange={(e) => setDeleteCategoryConfirm(e.target.value)}
              className={styles.modalInput}
              placeholder="delete"
            />
          </label>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={closeDeleteCategory}
              className={`${styles.btn} ${styles.btnSubtle} ${styles.btnSmall}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
              disabled={deleteCategoryConfirm.trim().toLowerCase() !== "delete"}
            >
              Delete
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={qrModalOpen} isVisible={qrModalOpen} title="">
        <div className={styles.qrModalBody}>
          {qrDataUrl && (
            <Image
              src={qrDataUrl}
              alt="Menu QR code large"
              className={styles.qrImageLarge}
              width={240}
              height={240}
            />
          )}
          {qrUrl && (
            <a href={qrUrl} target="_blank" rel="noopener noreferrer">
              {qrUrl}
            </a>
          )}
        </div>
        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={() => setQrModalOpen(false)}
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
          >
            Close
          </button>
        </div>
      </Modal>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = getSession(ctx.req);
  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const venueId = session.venueId;
  const db = await getDb();

  const tokenDoc = await db.collection("public_tokens").findOne({
    venueId: session.venueId,
    active: true,
  });

  const venue = await db
    .collection("venues")
    .findOne({ _id: new ObjectId(venueId) });
  if (!venue) return { notFound: true };

  const menu: Menu = venue.menu ?? { categories: [] };
  const languages = Array.isArray(venue.langs)
    ? venue.langs
    : ["en", "tr", "de"];

  let qrUrl: string | undefined;
  let qrDataUrl: string | undefined;

  if (tokenDoc) {
    qrUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/menu/${tokenDoc.token}`;
    qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 180, margin: 1 });
  }

  return {
    props: {
      venueId,
      venueName: venue.name ?? "Venue",
      menu,
      languages,
      ...(qrUrl && qrDataUrl ? { qrUrl, qrDataUrl } : {}),
    },
  };
};
