export const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type AuthUser = { id: number; name: string; email: string; is_admin: boolean };
export type TokenOut = { access_token: string; token_type: string; user: AuthUser };

export async function apiRegister(name: string, email: string, password: string, turnstileToken: string): Promise<{ message: string }> {
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, turnstile_token: turnstileToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Registration failed");
  return data;
}

export async function apiVerifyEmail(token: string): Promise<TokenOut> {
  const res = await fetch(`${API}/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Verification failed");
  return data;
}

export async function apiLogin(email: string, password: string): Promise<TokenOut> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Login failed");
  return data;
}

export async function apiForgotPassword(email: string): Promise<void> {
  await fetch(`${API}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword(token: string, password: string): Promise<void> {
  const res = await fetch(`${API}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Reset failed");
}

export type ProductImage = { id: number; url: string; position: number };

export type ProductCategory = "earrings" | "bracelet" | "necklace";

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  is_sold_out: boolean;
  is_active: boolean;
  category: ProductCategory;
  images: ProductImage[];
};

export type CartItem = {
  product_slug: string;
  quantity: number;
};

export type Cart = {
  id: string;
  items: CartItem[];
};

export type ProductSort = "default" | "price_asc" | "price_desc" | "most_loved";

export async function fetchProducts(opts?: { sort?: ProductSort; min?: number; max?: number; category?: ProductCategory }): Promise<Product[]> {
  const params = new URLSearchParams();
  if (opts?.sort && opts.sort !== "default") params.set("sort", opts.sort);
  if (opts?.min != null) params.set("min", String(opts.min));
  if (opts?.max != null) params.set("max", String(opts.max));
  if (opts?.category) params.set("category", opts.category);
  const qs = params.toString();
  const res = await fetch(`${API}/api/products/${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function createCartSession(): Promise<Cart> {
  const res = await fetch(`${API}/api/cart/sessions`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create cart session");
  return res.json();
}

export async function fetchCart(sessionId: string): Promise<Cart> {
  const res = await fetch(`${API}/api/cart/sessions/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch cart");
  return res.json();
}

export async function addToCart(sessionId: string, productSlug: string, quantity = 1): Promise<Cart> {
  const res = await fetch(`${API}/api/cart/sessions/${sessionId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_slug: productSlug, quantity }),
  });
  if (!res.ok) throw new Error("Failed to add item to cart");
  return res.json();
}

export async function updateCartItem(sessionId: string, productSlug: string, quantity: number): Promise<Cart> {
  const res = await fetch(`${API}/api/cart/sessions/${sessionId}/items/${productSlug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error("Failed to update cart item");
  return res.json();
}

export async function removeFromCart(sessionId: string, productSlug: string): Promise<Cart> {
  const res = await fetch(`${API}/api/cart/sessions/${sessionId}/items/${productSlug}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove cart item");
  return res.json();
}

export async function clearCart(sessionId: string): Promise<void> {
  await fetch(`${API}/api/cart/sessions/${sessionId}`, { method: "DELETE" });
}

export type OrderItemIn = {
  product_slug: string;
  product_name: string;
  image_url?: string;
  price: number;
  quantity: number;
};

export type OrderOut = {
  id: number;
  reference: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  phone2: string | null;
  total: number;
  status: string;
  items: OrderItemIn[];
};

export async function createOrder(payload: {
  name: string;
  email: string;
  phone: string;
  address: string;
  phone2?: string;
  note?: string;
  items: OrderItemIn[];
}): Promise<OrderOut> {
  const res = await fetch(`${API}/api/orders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? "Failed to place order");
  }
  return res.json();
}

export type OrderItem = { product_slug: string; product_name: string; image_url: string; price: number; quantity: number };
export type Order = { id: number; reference: string; name: string; email: string; phone: string; address: string; total: number; status: string; items: OrderItem[] };

export async function apiUpdateMe(token: string, name: string): Promise<AuthUser> {
  const res = await fetch(`${API}/api/auth/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Update failed");
  return data;
}

export async function apiChangePassword(token: string, current_password: string, new_password: string): Promise<void> {
  const res = await fetch(`${API}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ current_password, new_password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Failed to change password");
}

export async function apiMyOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${API}/api/auth/my-orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

// ── Admin ────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function adminFetchProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${API}/api/admin/products`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function adminCreateProduct(token: string, data: Omit<Product, "id" | "images">): Promise<Product> {
  const res = await fetch(`${API}/api/admin/products`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Failed to create product");
  return json;
}

export async function adminUpdateProduct(token: string, slug: string, data: Partial<Omit<Product, "id" | "slug">>): Promise<Product> {
  const res = await fetch(`${API}/api/admin/products/${slug}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Failed to update product");
  return json;
}

export async function adminDeleteProduct(token: string, slug: string): Promise<void> {
  const res = await fetch(`${API}/api/admin/products/${slug}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete product");
}

export async function adminFetchUsers(token: string): Promise<AdminUser[]> {
  const res = await fetch(`${API}/api/admin/users`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function adminCreateUser(token: string, data: { name: string; email: string; password: string; is_admin: boolean }): Promise<AdminUser> {
  const res = await fetch(`${API}/api/admin/users`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Failed to create user");
  return json;
}

export async function adminUpdateUser(token: string, id: number, data: Partial<{ name: string; email: string; password: string; is_admin: boolean; is_active: boolean }>): Promise<AdminUser> {
  const res = await fetch(`${API}/api/admin/users/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Failed to update user");
  return json;
}

export async function adminDeleteUser(token: string, id: number): Promise<void> {
  const res = await fetch(`${API}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete user");
}

export async function adminAddProductImage(token: string, slug: string, file: File): Promise<ProductImage> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/api/admin/products/${slug}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Upload failed");
  return json;
}

export async function adminDeleteProductImage(token: string, slug: string, imageId: number): Promise<void> {
  const res = await fetch(`${API}/api/admin/products/${slug}/images/${imageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete image");
}

export async function adminUploadImage(token: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/api/admin/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Upload failed");
  return json.url as string;
}

export async function adminFetchOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${API}/api/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Failed to fetch orders");
  return data;
}

export async function adminUpdateOrderStatus(token: string, id: number, status: string): Promise<Order> {
  const res = await fetch(`${API}/api/admin/orders/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Failed to update order");
  return data;
}
