import { products as fallbackProducts } from './data';

const request = async (path, options = {}) => {
  const response = await fetch(`https://flow-cast-ai.onrender.com/api${path}`, options);
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
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
