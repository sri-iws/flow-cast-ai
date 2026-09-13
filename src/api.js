import { products as fallbackProducts } from './data';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}/api${path}`, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.detail || payload?.message || `API request failed: ${response.status}`;
    throw new Error(message);
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return {};
};

const withCatalogImages = (items) => items.map(item => ({
  ...item,
  image: item.image || fallbackProducts.find(product => product.sku === item.sku)?.image
}));

export const getDashboard = async () => {
  const result = await request('/dashboard');
  return { ...result, products: withCatalogImages(result.products || []) };
};

export const getProducts = async () => withCatalogImages(await request('/products'));
export const getAlerts = async () => withCatalogImages(await request('/alerts'));
export const uploadSalesData = async (file) => {
  const body = new FormData();
  body.append('file', file);
  return request('/data/upload', { method: 'POST', body });
};

export const getOrders = async () => request('/orders');
export const registerUser = async form => request('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: form.fullName,
    email: form.email,
    username: form.username,
    password: form.password,
    role: form.role,
  })
});

export const loginUser = async (username, password, role = null) => request('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password, role })
});

export const createOrder = async order => request('/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productSku: order.product.sku,
    productName: order.product.name,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    supplier: order.supplier,
    deliveryDate: order.deliveryDate,
    notes: order.notes
  })
});
