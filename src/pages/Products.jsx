import { useMemo, useState } from 'react';
import { Download, Search, SlidersHorizontal } from 'lucide-react';
import ProductTable from '../components/ProductTable';

const downloadCatalogCsv = products => {
	const headers = ['product_id', 'product_name', 'category', 'stock_on_hand', 'demand_30_days', 'health', 'risk_percent', 'days_left', 'recommendation'];
	const rows = products.map(product => [product.sku, product.name, product.category, product.stock, product.demand, product.health, product.risk, product.daysLeft, product.recommendation]);
	const csv = [headers, ...rows]
		.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
		.join('\n');
	const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = `flow-cast-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
};

export default function Products({ products, notify, onReorder }) { const [search, setSearch] = useState(''); const [category, setCategory] = useState('All categories'); const filtered = useMemo(() => products.filter(product => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(search.toLowerCase()) && (category === 'All categories' || product.category === category)), [products, search, category]); return <section className="view active-view"><div className="page-heading compact"><div><p className="eyebrow">Catalog intelligence</p><h1>Products</h1><p className="lede">Search every SKU, health signal, and recommended next move.</p></div><button type="button" className="button primary" onClick={() => { downloadCatalogCsv(filtered); notify(`${filtered.length} catalog products exported.`); }}><Download size={14} /> Export catalog</button></div><div className="panel product-browser"><div className="browser-toolbar"><label className="search-box" htmlFor="product-search-input"><Search size={14} aria-hidden="true" /><input id="product-search-input" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search products or SKUs" aria-label="Search products or SKUs" /></label><label htmlFor="product-category-filter" className="sr-only">Filter by category</label><select id="product-category-filter" value={category} onChange={event => setCategory(event.target.value)} aria-label="Filter by category"><option>All categories</option>{[...new Set(products.map(product => product.category))].map(item => <option key={item}>{item}</option>)}</select><button type="button" className="filter-button" aria-label="Open product filters"><SlidersHorizontal size={13} /> Filters</button></div><ProductTable products={filtered} onReorder={onReorder} /></div></section>; }
