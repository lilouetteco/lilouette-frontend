import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { Pencil, Trash2, Plus, X, Upload, ShieldCheck, Shield } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/lib/auth";
import {
  adminFetchProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct, adminUploadImage,
  adminAddProductImage, adminDeleteProductImage,
  adminFetchUsers, adminCreateUser, adminUpdateUser, adminDeleteUser,
  adminFetchOrders, adminUpdateOrderStatus,
  type Product, type ProductImage, type AdminUser, type Order, API,
} from "@/lib/api";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Lilouette" }] }),
  component: AdminPage,
});

type Tab = "products" | "users" | "orders";

function AdminPage() {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("products");

  useEffect(() => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (!isAdmin) { navigate({ to: "/" }); }
  }, [user, isAdmin]);

  if (!isAdmin) return null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">Dashboard</p>
          <h1 className="font-display text-5xl">Admin</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border/40">
          {(["products", "users", "orders"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm tracking-wide capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "products" && token && <ProductsTab token={token} />}
        {tab === "users"    && token && <UsersTab token={token} currentUserId={user?.id ?? 0} />}
        {tab === "orders"   && token && <OrdersTab token={token} />}
      </div>
    </SiteLayout>
  );
}

// ── Products tab ──────────────────────────────────────────────────────────────

type ProductForm = {
  name: string; slug: string; description: string;
  price: string; stock: string; is_active: boolean; is_sold_out: boolean; image_url: string;
};
const EMPTY_PRODUCT: ProductForm = {
  name: "", slug: "", description: "", price: "", stock: "", is_active: true, is_sold_out: false, image_url: "",
};
function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ProductsTab({ token }: { token: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [gallerySlug, setGallerySlug] = useState<string | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setProducts(await adminFetchProducts(token)); } finally { setLoading(false); }
  }

  function openCreate() { setForm(EMPTY_PRODUCT); setEditSlug(null); setError(null); setShowForm(true); }
  function openEdit(p: Product) {
    setForm({ name: p.name, slug: p.slug, description: p.description, price: String(p.price), stock: String(p.stock), is_active: p.is_active, is_sold_out: p.is_sold_out, image_url: p.image_url });
    setEditSlug(p.slug); setError(null); setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditSlug(null); setForm(EMPTY_PRODUCT); setError(null); }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { setForm((f) => ({ ...f, image_url: "" })); const url = await adminUploadImage(token, file); setForm((f) => ({ ...f, image_url: url })); }
    catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      const payload = { name: form.name, slug: form.slug, description: form.description, price: parseFloat(form.price), stock: parseInt(form.stock, 10), is_active: form.is_active, is_sold_out: form.is_sold_out, image_url: form.image_url };
      if (editSlug) {
        const { slug: _s, ...update } = payload;
        const updated = await adminUpdateProduct(token, editSlug, update);
        setProducts((ps) => ps.map((p) => p.slug === editSlug ? updated : p));
      } else {
        const created = await adminCreateProduct(token, payload);
        setProducts((ps) => [created, ...ps]);
      }
      closeForm();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSaving(false); }
  }

  async function handleDelete(slug: string) {
    try { await adminDeleteProduct(token, slug); setProducts((ps) => ps.filter((p) => p.slug !== slug)); setDeleteConfirm(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Delete failed"); }
  }

  async function handleGalleryUpload(e: ChangeEvent<HTMLInputElement>, slug: string) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setGalleryUploading(true);
    try {
      for (const file of files) {
        const img = await adminAddProductImage(token, slug, file);
        setProducts((ps) => ps.map((p) => p.slug === slug ? { ...p, images: [...p.images, img] } : p));
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setGalleryUploading(false); e.target.value = ""; }
  }

  async function handleGalleryDelete(slug: string, imageId: number) {
    try {
      await adminDeleteProductImage(token, slug, imageId);
      setProducts((ps) => ps.map((p) => p.slug === slug ? { ...p, images: p.images.filter((i) => i.id !== imageId) } : p));
    } catch (err) { setError(err instanceof Error ? err.message : "Delete failed"); }
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm tracking-wide transition-all hover:bg-accent">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      {showForm && (
        <div className="mb-8 rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="flex items-center justify-between px-7 py-5 border-b border-border/40">
            <h2 className="font-display text-2xl">{editSlug ? "Edit product" : "New product"}</h2>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-7 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Name">
              <input required className="admin-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editSlug ? f.slug : toSlug(e.target.value) }))} placeholder="Gold Hoop Earrings" />
            </Field>
            <Field label="Slug">
              <input required className="admin-input" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} disabled={!!editSlug} placeholder="gold-hoop-earrings" />
            </Field>
            <Field label="Price (€)">
              <input required type="number" min="0" step="0.01" className="admin-input" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="39.00" />
            </Field>
            <Field label="Stock quantity">
              <input required type="number" min="0" className="admin-input" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="10" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <textarea required rows={3} className="admin-input resize-none" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="A short description…" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Cover image">
                <div className="flex gap-3 items-start">
                  <input className="admin-input flex-1" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="/static/products/filename.jpg" />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-[0.7rem] text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50 whitespace-nowrap">
                    <Upload className="h-4 w-4" />{uploading ? "Uploading…" : "Upload"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
                {form.image_url && <img src={form.image_url.startsWith("/") ? `${API}${form.image_url}` : form.image_url} alt="Preview" className="mt-3 h-24 w-24 rounded-xl object-cover bg-secondary" />}
              </Field>
            </div>
            {editSlug && (() => {
              const editingProduct = products.find((p) => p.slug === editSlug);
              const galleryImages = editingProduct?.images ?? [];
              return (
                <div className="md:col-span-2">
                  <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground mb-3">Gallery images</p>
                  <div className="flex flex-wrap gap-3 items-end">
                    {galleryImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img src={`${API}${img.url}`} alt="" className="h-20 w-20 rounded-xl object-cover bg-secondary" />
                        <button
                          type="button"
                          onClick={() => handleGalleryDelete(editSlug, img.id)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove"
                        ><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <label className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-foreground transition-colors text-muted-foreground hover:text-foreground">
                      <Upload className="h-4 w-4" />
                      <span className="text-[10px]">{galleryUploading ? "…" : "Add"}</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGalleryUpload(e, editSlug)} disabled={galleryUploading} />
                    </label>
                  </div>
                </div>
              );
            })()}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 accent-[var(--accent)]" />
              <label htmlFor="is_active" className="text-sm text-muted-foreground cursor-pointer">Active (visible on site)</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_sold_out" checked={form.is_sold_out} onChange={(e) => setForm((f) => ({ ...f, is_sold_out: e.target.checked }))} className="h-4 w-4 accent-[var(--accent)]" />
              <label htmlFor="is_sold_out" className="text-sm text-muted-foreground cursor-pointer">Mark as sold out</label>
            </div>
            {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={closeForm} className="rounded-full border border-border px-5 py-2.5 text-sm hover:border-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm tracking-wide transition-all hover:bg-accent disabled:opacity-60">
                {saving ? "Saving…" : editSlug ? "Save changes" : "Create product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-secondary animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-center py-20">No products yet.</p>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/40">
                <th className="text-left px-5 py-3.5 text-xs tracking-[0.15em] uppercase text-muted-foreground font-normal">Product</th>
                <th className="text-right px-5 py-3.5 text-xs tracking-[0.15em] uppercase text-muted-foreground font-normal">Price</th>
                <th className="text-right px-5 py-3.5 text-xs tracking-[0.15em] uppercase text-muted-foreground font-normal">Stock</th>
                <th className="text-center px-5 py-3.5 text-xs tracking-[0.15em] uppercase text-muted-foreground font-normal">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {products.map((p) => (
                <Fragment key={p.id}>
                <tr className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={`${API}${p.image_url}`} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-secondary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">€{p.price}</td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    <span className={p.stock === 0 ? "text-destructive font-medium" : ""}>{p.stock === 0 ? "0" : p.stock}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                        {p.is_active ? "Active" : "Hidden"}
                      </span>
                      {(p.is_sold_out || p.stock === 0) && (
                        <span className="inline-block rounded-full px-2.5 py-0.5 text-xs bg-orange-100 text-orange-700">Sold out</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setGallerySlug(gallerySlug === p.slug ? null : p.slug)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Gallery"><Upload className="h-3.5 w-3.5" /></button>
                      {deleteConfirm === p.slug ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleDelete(p.slug)} className="rounded-lg bg-destructive text-white px-2.5 py-1 text-xs hover:opacity-90">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border border-border px-2.5 py-1 text-xs hover:border-foreground transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(p.slug)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
                {gallerySlug === p.slug && (
                  <tr key={`${p.slug}-gallery`}>
                    <td colSpan={5} className="px-5 pb-5 bg-secondary/10">
                      <div className="pt-3">
                        <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground mb-3">Gallery images</p>
                        <div className="flex flex-wrap gap-3 items-end">
                          {p.images.map((img) => (
                            <div key={img.id} className="relative group">
                              <img src={`${API}${img.url}`} alt="" className="h-20 w-20 rounded-xl object-cover bg-secondary" />
                              <button
                                onClick={() => handleGalleryDelete(p.slug, img.id)}
                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                              ><X className="h-3 w-3" /></button>
                            </div>
                          ))}
                          <label className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-foreground transition-colors text-muted-foreground hover:text-foreground">
                            <Upload className="h-4 w-4" />
                            <span className="text-[10px]">{galleryUploading ? "…" : "Add"}</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleGalleryUpload(e, p.slug)} disabled={galleryUploading} ref={gallerySlug === p.slug ? galleryFileRef : undefined} />
                          </label>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

type UserForm = { name: string; email: string; password: string; is_admin: boolean; is_active: boolean };
const EMPTY_USER: UserForm = { name: "", email: "", password: "", is_admin: false, is_active: true };

function UsersTab({ token, currentUserId }: { token: string; currentUserId: number }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "admin" | "user">("all");
  const [form, setForm] = useState<UserForm>(EMPTY_USER);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setUsers(await adminFetchUsers(token)); } finally { setLoading(false); }
  }

  function openCreate() { setForm(EMPTY_USER); setEditId(null); setError(null); setShowForm(true); }
  function openEdit(u: AdminUser) {
    setForm({ name: u.name, email: u.email, password: "", is_admin: u.is_admin, is_active: u.is_active });
    setEditId(u.id); setError(null); setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditId(null); setForm(EMPTY_USER); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      if (editId !== null) {
        const update: Parameters<typeof adminUpdateUser>[2] = { name: form.name, email: form.email, is_admin: form.is_admin, is_active: form.is_active };
        if (form.password) update.password = form.password;
        const updated = await adminUpdateUser(token, editId, update);
        setUsers((us) => us.map((u) => u.id === editId ? updated : u));
      } else {
        const created = await adminCreateUser(token, { name: form.name, email: form.email, password: form.password, is_admin: form.is_admin });
        setUsers((us) => [...us, created]);
      }
      closeForm();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try { await adminDeleteUser(token, id); setUsers((us) => us.filter((u) => u.id !== id)); setDeleteConfirm(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Delete failed"); }
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm tracking-wide transition-all hover:bg-accent">
          <Plus className="h-4 w-4" /> Add user
        </button>
      </div>

      {showForm && (
        <div className="mb-8 rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="flex items-center justify-between px-7 py-5 border-b border-border/40">
            <h2 className="font-display text-2xl">{editId ? "Edit user" : "New user"}</h2>
            <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-7 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Full name">
              <input required className="admin-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Lilou Bonnet" />
            </Field>
            <Field label="Email">
              <input required type="email" className="admin-input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="lilou@example.com" />
            </Field>
            <Field label={editId ? "New password (leave blank to keep)" : "Password"}>
              <input
                required={!editId}
                type="password" className="admin-input" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={editId ? "Leave blank to keep current" : "Min. 8 characters"}
              />
            </Field>
            <div className="flex flex-col gap-3 justify-center">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="u_is_admin" checked={form.is_admin} onChange={(e) => setForm((f) => ({ ...f, is_admin: e.target.checked }))} className="h-4 w-4 accent-[var(--accent)]" />
                <label htmlFor="u_is_admin" className="text-sm text-muted-foreground cursor-pointer">Admin access</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="u_is_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 accent-[var(--accent)]" />
                <label htmlFor="u_is_active" className="text-sm text-muted-foreground cursor-pointer">Active account</label>
              </div>
            </div>
            {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
            <div className="md:col-span-2 flex gap-3 justify-end pt-2">
              <button type="button" onClick={closeForm} className="rounded-full border border-border px-5 py-2.5 text-sm hover:border-foreground transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm tracking-wide transition-all hover:bg-accent disabled:opacity-60">
                {saving ? "Saving…" : editId ? "Save changes" : "Create user"}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && !showForm && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {/* Filter */}
      {!loading && users.length > 0 && (
        <div className="flex gap-2 mb-5">
          {(["all", "admin", "user"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs tracking-[0.15em] uppercase transition-colors ${
                filter === f
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? `All (${users.length})` : f === "admin" ? `Admins (${users.filter((u) => u.is_admin).length})` : `Users (${users.filter((u) => !u.is_admin).length})`}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-secondary animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground text-center py-20">No users found.</p>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/40">
                <th className="text-left px-5 py-3.5 text-xs tracking-[0.15em] uppercase text-muted-foreground font-normal">User</th>
                <th className="text-center px-5 py-3.5 text-xs tracking-[0.15em] uppercase text-muted-foreground font-normal">Role</th>
                <th className="text-center px-5 py-3.5 text-xs tracking-[0.15em] uppercase text-muted-foreground font-normal">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {users.filter((u) => filter === "all" || (filter === "admin" ? u.is_admin : !u.is_admin)).map((u) => (
                <tr key={u.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs bg-accent/10 text-accent">
                        <ShieldCheck className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs bg-secondary text-muted-foreground">
                        <Shield className="h-3 w-3" /> User
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${u.is_active ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                      {u.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      {u.id !== currentUserId && (
                        deleteConfirm === u.id ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleDelete(u.id)} className="rounded-lg bg-destructive text-white px-2.5 py-1 text-xs hover:opacity-90">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border border-border px-2.5 py-1 text-xs hover:border-foreground transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(u.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">{label}</span>
      {children}
    </label>
  );
}

// ── Orders tab ────────────────────────────────────────────────────────────────

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function OrdersTab({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetchOrders(token).then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleStatus(id: number, status: string) {
    const updated = await adminUpdateOrderStatus(token, id, status);
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground text-sm">Loading orders…</div>;
  if (orders.length === 0) return <div className="py-16 text-center text-muted-foreground text-sm">No orders yet.</div>;

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="rounded-xl border border-border/50 p-5">
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-1">
                Order #{order.reference}
              </p>
              <p className="font-display text-xl">€{order.total.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{order.name} · {order.email} · {order.phone}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{order.address}</p>
            </div>
            <select
              value={order.status}
              onChange={(e) => handleStatus(order.id, e.target.value)}
              className={`rounded-full px-3 py-1.5 text-xs border cursor-pointer outline-none transition-colors ${
                order.status === "confirmed" || order.status === "delivered" ? "bg-green-50 text-green-700 border-green-200" :
                order.status === "shipped" ? "bg-blue-50 text-blue-700 border-blue-200" :
                order.status === "cancelled" ? "bg-red-50 text-red-600 border-red-200" :
                "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <ul className="space-y-2 border-t border-border/40 pt-3">
            {order.items.map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-center gap-3">
                <img
                  src={`${API}${item.image_url}`}
                  alt={item.product_name}
                  className="h-10 w-10 rounded-lg object-cover bg-secondary flex-shrink-0"
                />
                <span className="flex-1">{item.product_name} × {item.quantity}</span>
                <span>€{(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
