const products = [];

const views = ['overview','products','forecasts','alerts','data','settings'];
const contextNames = {overview:'Overview',products:'Products',forecasts:'Forecasts',alerts:'Alerts',data:'Import data',settings:'Settings'};
const productRows = document.getElementById('product-rows');
const toast = document.getElementById('toast');
let toastTimer;

function showToast(message){
  document.getElementById('toast-message').textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function renderProducts(){
  const search = (document.getElementById('product-search')?.value || '').toLowerCase();
  const category = document.getElementById('category-filter')?.value || 'All categories';
  const filtered = products.filter(product => {
    const matchesSearch = [product.name, product.sku, product.category].join(' ').toLowerCase().includes(search);
    return matchesSearch && (category === 'All categories' || product.category === category);
  });

  productRows.innerHTML = '';

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No products match this search.';
    productRows.appendChild(empty);
    return;
  }

  filtered.forEach(product => {
    const healthClass = product.health === 'Healthy' ? 'good' : product.health === 'Watch' ? 'watch' : 'bad';
    const row = document.createElement('div');
    row.className = 'product-data-row';

    const productCell = document.createElement('div');
    productCell.className = 'product-cell';

    const thumb = document.createElement('div');
    thumb.className = 'product-thumb';
    thumb.classList.add(product.category === 'Electronics' ? 'headphones' : product.category === 'Travel' ? 'bag' : product.category === 'Apparel' ? 'shirt' : product.category === 'Home office' ? 'lamp' : 'bottle');
    thumb.textContent = product.category === 'Electronics' ? '◖◗' : product.category === 'Travel' ? '▱' : product.category === 'Apparel' ? '▤' : product.category === 'Home office' ? '◒' : '♒';

    const details = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = product.name;
    const sku = document.createElement('small');
    sku.textContent = product.sku;
    details.append(name, sku);

    productCell.append(thumb, details);

    const categoryCell = document.createElement('span');
    categoryCell.textContent = product.category;

    const stock = document.createElement('b');
    stock.textContent = String(product.stock);

    const demand = document.createElement('span');
    demand.textContent = String(product.demand);

    const healthLabel = document.createElement('span');
    healthLabel.className = 'health-label';
    const dot = document.createElement('i');
    dot.className = `health-dot ${healthClass}`;
    const status = document.createElement('span');
    status.textContent = product.health;
    healthLabel.append(dot, status);

    const recommendation = document.createElement('span');
    recommendation.className = 'recommendation';
    recommendation.textContent = product.recommendation;

    row.append(productCell, categoryCell, stock, demand, healthLabel, recommendation);
    productRows.appendChild(row);
  });
}

function navigate(view){
  views.forEach(name => document.getElementById(`${name}-view`).classList.toggle('active-view', name === view));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  document.getElementById('page-context').textContent = contextNames[view];
  if(view === 'products') renderProducts();
  window.scrollTo({top:0, behavior:'smooth'});
}

document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => navigate(item.dataset.view)));
document.querySelectorAll('[data-view-target]').forEach(item => item.addEventListener('click', () => navigate(item.dataset.viewTarget)));
document.querySelectorAll('.period').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.period').forEach(period => period.classList.remove('active'));
  button.classList.add('active');
  showToast(`Showing the ${button.dataset.period}-day demand outlook.`);
}));
document.getElementById('product-search')?.addEventListener('input', renderProducts);
document.getElementById('category-filter')?.addEventListener('change', renderProducts);
document.querySelectorAll('.reorder-button').forEach(button => button.addEventListener('click', event => {
  event.stopPropagation();
  button.textContent = 'Added';
  button.style.background = '#dff4ee';
  showToast('Reorder recommendation added to your action list.');
}));
document.querySelectorAll('.risk-row').forEach(row => row.addEventListener('click', () => {
  navigate('forecasts');
  showToast(`Forecast details opened for ${row.dataset.product}.`);
}));
document.getElementById('report-button').addEventListener('click', () => {
  const report = 'Flow Cast AI Inventory Report\\nGenerated: September 8, 2026\\n\\nInventory health: 84.6%\\nAt stockout risk: 8 SKUs\\nOverstocked: 23 SKUs\\nForecast accuracy: 14.8% WAPE';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([report], {type:'text/plain'}));
  link.download = 'flow-cast-inventory-report.txt';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Under Progress...');
});
document.getElementById('product-export')?.addEventListener('click', () => showToast('Catalog export is ready to download.'));
document.getElementById('search-trigger').addEventListener('click', () => { navigate('products'); document.getElementById('product-search').focus(); });
document.getElementById('notification-trigger').addEventListener('click', () => { navigate('alerts'); showToast('Showing your 8 open alerts.'); });

const modal = document.getElementById('upload-modal');
function openModal(){ modal.classList.add('open'); }
function closeModal(){ modal.classList.remove('open'); }
document.getElementById('upload-button').addEventListener('click', openModal);
document.getElementById('data-upload').addEventListener('click', openModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if(event.target === modal) closeModal(); });
document.getElementById('csv-input').addEventListener('change', event => {
  const file = event.target.files[0];
  if(file) document.querySelector('.drop-zone strong').textContent = file.name;
});
document.getElementById('modal-import').addEventListener('click', () => { closeModal(); showToast('CSV validated. Forecast pipeline queued for processing.'); });

document.querySelectorAll('.alert-card .button').forEach(button => button.addEventListener('click', () => showToast('Action added to your purchasing workflow.')));
document.querySelectorAll('.settings-panel .button').forEach(button => button.addEventListener('click', () => showToast('Workspace settings saved.')));
