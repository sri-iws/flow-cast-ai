import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Overview from './pages/Overview';
import Products from './pages/Products';
import Orders from './pages/Orders';
import AuthPage from './pages/AuthPage';
import { Alerts, DataImport, ForecastPortfolio, Forecasts, Settings } from './pages/WorkspacePages';
import { createOrder, getDashboard, getOrders, getProducts, uploadSalesData } from './api';
import PurchaseOrderModal from './components/PurchaseOrderModal';
import { readStored, writeStored } from './storage';


const contexts = { overview: 'Overview', products: 'Products', forecasts: 'Forecasts', alerts: 'Alerts', orders: 'Orders', data: 'Import data', settings: 'Settings' };
const roleViews = {
  manager: ['overview', 'products', 'forecasts', 'alerts', 'orders', 'data', 'settings'],
  analyst: ['overview', 'products', 'forecasts', 'alerts'],
  ceo: ['overview', 'products', 'forecasts', 'alerts', 'orders', 'settings'],
};

export default function App() {
  const [session, setSession] = useState(() => readStored('flowSession', null));
  const [view, setView] = useState(() => readStored('view', 'overview'));
  const [dashboard, setDashboard] = useState({ metrics: { health: 84.6, stockoutRisk: 8, overstocked: 23, accuracy: 14.8 }, products: [], insight: '' });
  const [products, setProducts] = useState([]);
  const [toast, setToast] = useState('');
  const [purchaseProduct, setPurchaseProduct] = useState(null);
  const [reviewSku, setReviewSku] = useState(() => readStored('reviewSku', null));
  const [purchaseOrders, setPurchaseOrders] = useState(() => readStored('purchaseOrders', []));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const activeRole = session?.role || 'manager';
  const allowedViews = roleViews[activeRole] || roleViews.manager;

  useEffect(() => {
    writeStored('flowSession', session);
  }, [session]);

  const handleAuthenticated = nextSession => {
    setSession(nextSession);
    setView('overview');
  };

  const logout = () => {
    setSession(null);
    setView('overview');
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [dashboardData, productData, savedOrders] = await Promise.all([getDashboard(), getProducts(), getOrders()]);
      setDashboard(dashboardData);
      setProducts(productData);
      setPurchaseOrders(savedOrders);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load inventory data.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  useEffect(() => {
    if (session && !allowedViews.includes(view)) {
      setView(allowedViews[0]);
    }
  }, [allowedViews, session, view]);

  useEffect(() => { writeStored('view', view); }, [view]);
  useEffect(() => { writeStored('reviewSku', reviewSku); }, [reviewSku]);
  useEffect(() => { writeStored('purchaseOrders', purchaseOrders); }, [purchaseOrders]);
  const notify = message => { setToast(message); window.clearTimeout(window.__flowToast); window.__flowToast = window.setTimeout(() => setToast(''), 3200); };
  const navigate = next => {
    if (!allowedViews.includes(next)) return;
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const upload = async file => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      notify('Please select a CSV file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      notify('CSV files must be smaller than 50 MB.');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadSalesData(file);
      notify(result?.status === 'queued' ? `${file.name} validated and queued for processing.` : result?.message || 'Upload could not be processed.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  const allProducts = products.length ? products : dashboard.products;
  const createPurchaseOrder = async order => {
    try {
      const savedOrder = await createOrder(order);
      setPurchaseOrders(previous => [savedOrder, ...previous]);
      setPurchaseProduct(null);
      notify(`Purchase order created for ${order.quantity} units of ${order.product.name}.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Purchase order could not be created.');
    }
  };

  if (!session) return <AuthPage onAuthenticated={handleAuthenticated} />;
  if (loading) return <main className="app-shell app-state-shell"><div className="app-state"><span className="loading-spinner" /><p className="eyebrow">Flow Cast AI</p><h1>Loading inventory intelligence</h1><p>Connecting to the forecast engine...</p></div></main>;
  if (loadError) return <main className="app-shell app-state-shell"><div className="app-state error-state"><span className="error-mark">!</span><p className="eyebrow">Connection problem</p><h1>We couldn’t load your inventory</h1><p>{loadError}</p><button className="button primary" onClick={loadData}>Try again</button></div></main>;
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    
    <Sidebar view={view} onNavigate={navigate} user={session} allowedViews={allowedViews} />
    <main id="main-content" className="main-content" tabIndex="-1">
    <Topbar context={contexts[view]} user={session} onLogout={logout} onSearch={() => navigate('products')} onAlerts={() => navigate('alerts')} />
    {view === 'overview' && 
    <Overview dashboard={{ ...dashboard, products: allProducts }} user={session} onNavigate={navigate} notify={notify} onReorder={setPurchaseProduct} onReview={product => { setReviewSku(product.sku); navigate('forecasts'); }} />}{view === 'products' && 
    <Products products={allProducts} notify={notify} onReorder={setPurchaseProduct} />}{view === 'forecasts' && <ForecastPortfolio products={allProducts} notify={notify} selectedSku={reviewSku} />}{view === 'alerts' && 
    <Alerts products={allProducts} notify={notify} onReorder={setPurchaseProduct} />}{view === 'orders' && <Orders orders={purchaseOrders} />}{view === 'data' && 
    <DataImport notify={notify} onUpload={upload} uploading={uploading} />}{view === 'settings' && 
    <Settings notify={notify} />}
    </main>{toast && <div className="toast show" role="status" aria-live="polite" aria-atomic="true"><span className="toast-check">✓</span><span>{toast}</span></div>}{purchaseProduct && <PurchaseOrderModal product={purchaseProduct} onClose={() => setPurchaseProduct(null)} onSubmit={createPurchaseOrder} />}</div>;
}
