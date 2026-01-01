import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

import { getSession } from "@/lib/session";
import Layout from "@/layout/layout";
import { CategoryCard } from "@/components/menu/CategoryCard";
import { Modal } from "@/components/menu/Modal";
import styles from "@/styles/menu/menu.module.scss";
import { Category, Menu, MenuItem } from "@/types/menu";

type Props = {
  venueId: string; // ObjectId as string
  venueName: string;
  menu: Menu;
};

function uid(prefix = "id") {
  // simple unique id for UI-created objects
  return `${prefix}_${Math.random()
    .toString(16)
    .slice(2)}_${Date.now().toString(16)}`;
}

export default function OwnerMenuPage({
  venueId,
  venueName: initialVenueName,
  menu: initialMenu,
}: Props) {
  const [venueName, setVenueName] = useState(initialVenueName);
  const [menu, setMenu] = useState<Menu>(initialMenu);
  const [hasChanges, setHasChanges] = useState(false);

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    initialMenu.categories[0]?.id ?? null
  );

  const [status, setStatus] = useState<string>("");
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameVisible, setRenameVisible] = useState(false);
  const [addTarget, setAddTarget] = useState<{ catId: string } | null>(null);
  const [addValues, setAddValues] = useState<{
    name: string;
    price: string;
    description: string;
  }>({ name: "", price: "", description: "" });
  const [addVisible, setAddVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    catId: string;
    itemId: string;
  } | null>(null);
  const [editValues, setEditValues] = useState<{
    name: string;
    price: string;
    description: string;
  }>({ name: "", price: "", description: "" });
  const [editVisible, setEditVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    catId: string;
    itemId: string;
    name: string;
  } | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryVisible, setNewCategoryVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  function addCategory() {
    setNewCategoryName("");
    setNewCategoryOpen(true);
  }

  function renameCategory(catId: string) {
    const cat = menu.categories.find((c) => c.id === catId);
    if (!cat) return;
    setRenameTarget({ id: catId, name: cat.title });
    setRenameValue(cat.title);
  }

  function deleteCategory(catId: string) {
    const cat = menu.categories.find((c) => c.id === catId);
    if (!cat) return;
    if (!confirm(`Delete category "${cat.title}"?`)) return;

    setMenu((m) => {
      const next = m.categories.filter((c) => c.id !== catId);
      return { ...m, categories: next };
    });
    setHasChanges(true);

    if (expandedCategoryId === catId) {
      setExpandedCategoryId(null);
    }
  }

  function addItem(catId: string) {
    setAddTarget({ catId });
    setAddValues({ name: "", price: "", description: "" });
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addTarget) return;

    const name = addValues.name.trim();
    if (!name) return;

    const price = Number(addValues.price);
    if (Number.isNaN(price)) return;

    const description = addValues.description.trim() || undefined;

    const item: MenuItem = { id: uid("item"), name, price, description };

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
      setAddValues({ name: "", price: "", description: "" });
    }, 200);
  }

  function closeAdd() {
    setAddVisible(false);
    setTimeout(() => {
      setAddTarget(null);
      setAddValues({ name: "", price: "", description: "" });
    }, 200);
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget) return;
    const title = renameValue.trim();
    if (!title) return;

    setMenu((m) => ({
      ...m,
      categories: m.categories.map((c) =>
        c.id === renameTarget.id ? { ...c, title } : c
      ),
    }));
    setHasChanges(true);
    setRenameVisible(false);
    setTimeout(() => {
      setRenameTarget(null);
      setRenameValue("");
    }, 200);
  }

  function submitNewCategory(e: React.FormEvent) {
    e.preventDefault();
    const title = newCategoryName.trim();
    if (!title) return;
    const newCat: Category = { id: uid("cat"), title, items: [] };
    setMenu((m) => ({ ...m, categories: [...m.categories, newCat] }));
    setHasChanges(true);
    setExpandedCategoryId(newCat.id);
    setNewCategoryVisible(false);
    setTimeout(() => {
      setNewCategoryOpen(false);
      setNewCategoryName("");
    }, 200);
  }

  function closeNewCategory() {
    setNewCategoryVisible(false);
    setTimeout(() => {
      setNewCategoryOpen(false);
      setNewCategoryName("");
    }, 200);
  }

  function closeRename() {
    setRenameVisible(false);
    setTimeout(() => {
      setRenameTarget(null);
      setRenameValue("");
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
    setEditValues({
      name: item.name,
      price: String(item.price),
      description: item.description ?? "",
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

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;

    const name = editValues.name.trim();
    if (!name) return;

    const price = Number(editValues.price);
    if (Number.isNaN(price)) return;

    const description = editValues.description.trim();

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
                  name,
                  price,
                  description: description || undefined,
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
      setEditValues({ name: "", price: "", description: "" });
    }, 200);
  }

  function closeEdit() {
    setEditVisible(false);
    setTimeout(() => {
      setEditTarget(null);
      setEditValues({ name: "", price: "", description: "" });
    }, 200);
  }

  async function save() {
    try {
      setStatus("Saving...");
      const res = await fetch("/api/owner/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, venueName, menu }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("Saved ✅");
      setHasChanges(false);
    } catch {
      setStatus("Error ❌");
    }
  }

  return (
    <Layout isLoggedIn showLogin={false}>
      <div className={styles.wrapper}>
        <h1>Owner · Edit Menu</h1>

        <div className={styles.venueRow}>
          <label>
            Venue name:{" "}
            <input
              value={venueName}
              onChange={(e) => {
                setVenueName(e.target.value);
                setHasChanges(true);
              }}
              className={styles.venueInput}
            />
          </label>
        </div>

        <section className={styles.section}>
          <div className={styles.headerRow}>
            <b>Categories</b>
            <button
              onClick={addCategory}
              className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSmall}`}
            >
              + Add new category
            </button>
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
                    name: item?.name ?? "Item",
                  });
                }}
              />
            );
          })}
        </section>

        <div className={styles.footer}>
          <button
            onClick={save}
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}
            disabled={!hasChanges}
          >
            Save
          </button>
          <span>{status}</span>
        </div>
      </div>

      {renameTarget && (
        <div
          className={`${styles.overlay} ${
            renameVisible ? styles.overlayVisible : ""
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`${styles.modal} ${
              renameVisible ? styles.modalVisible : ""
            }`}
          >
            <h3 className={styles.modalTitle}>Rename category</h3>
            <form onSubmit={submitRename} className={styles.modalForm}>
              <label className={styles.modalLabel}>
                <span>New name</span>
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                  className={styles.modalInput}
                />
              </label>
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editTarget && (
        <div
          className={`${styles.overlay} ${
            editVisible ? styles.overlayVisible : ""
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`${styles.modal} ${
              editVisible ? styles.modalVisible : ""
            }`}
          >
            <h3 className={styles.modalTitle}>Edit item</h3>
            <form onSubmit={submitEdit} className={styles.modalForm}>
              <label className={styles.modalLabel}>
                <span>Name</span>
                <input
                  value={editValues.name}
                  onChange={(e) =>
                    setEditValues((v) => ({ ...v, name: e.target.value }))
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
                <span>Description</span>
                <textarea
                  value={editValues.description}
                  onChange={(e) =>
                    setEditValues((v) => ({
                      ...v,
                      description: e.target.value,
                    }))
                  }
                  className={styles.modalInput}
                  rows={3}
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        isOpen={newCategoryOpen}
        isVisible={newCategoryVisible}
        title="Add category"
      >
        <form onSubmit={submitNewCategory} className={styles.modalForm}>
          <label className={styles.modalLabel}>
            <span>Name</span>
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
              className={styles.modalInput}
              required
            />
          </label>
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
          <label className={styles.modalLabel}>
            <span>New name</span>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              className={styles.modalInput}
            />
          </label>
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
              Save
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
          <label className={styles.modalLabel}>
            <span>Name</span>
            <input
              value={editValues.name}
              onChange={(e) =>
                setEditValues((v) => ({ ...v, name: e.target.value }))
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
            <span>Description</span>
            <textarea
              value={editValues.description}
              onChange={(e) =>
                setEditValues((v) => ({
                  ...v,
                  description: e.target.value,
                }))
              }
              className={styles.modalInput}
              rows={3}
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
              Save
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
          <label className={styles.modalLabel}>
            <span>Name</span>
            <input
              value={addValues.name}
              onChange={(e) =>
                setAddValues((v) => ({ ...v, name: e.target.value }))
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
            <span>Description</span>
            <textarea
              value={addValues.description}
              onChange={(e) =>
                setAddValues((v) => ({
                  ...v,
                  description: e.target.value,
                }))
              }
              className={styles.modalInput}
              rows={3}
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
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
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

  const venue = await db
    .collection("venues")
    .findOne({ _id: new ObjectId(venueId) });
  if (!venue) return { notFound: true };

  const menu: Menu = venue.menu ?? { categories: [] };

  return {
    props: {
      venueId,
      venueName: venue.name ?? "Venue",
      menu,
    },
  };
};
