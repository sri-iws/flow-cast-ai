import { useState } from 'react';
import { ArrowDownToLine, ChevronRight, Upload } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ProductTable from '../components/ProductTable';

export default function Overview({ dashboard, onNavigate, notify, onReorder, onReview, user }) {
  const [period, setPeriod] = useState('7');
  const [selectedProductSku, setSelectedProductSku] = useState('all');
  const [algorithm, setAlgorithm] = useState('LightGBM');
  const safeProducts = Array.isArray(dashboard?.products) ? dashboard.products : [];
  const safeMetrics = dashboard?.metrics || { health: 0, stockoutRisk: 0, overstocked: 0, accuracy: 0 };
  const insightText = dashboard?.insight || 'Inventory is stable and ready for the next review window.';
  const riskProducts = safeProducts.filter(product => Number(product?.risk ?? 0) >= 60);
  const metrics = [
    { label: 'Inventory health', value: safeMetrics.health, unit: '%', change: '↑ 4.2%', tone: 'teal' },
    { label: 'At stockout risk', value: safeMetrics.stockoutRisk, unit: ' SKUs', change: '↑ 2', tone: 'coral' },
    { label: 'Overstocked', value: safeMetrics.overstocked, unit: ' SKUs', change: '↓ 6', tone: 'amber' },
    { label: 'Forecast engine WAPE', value: safeMetrics.accuracy, unit: '% WAPE', change: '↑ 1.8%', tone: 'blue' }
  ];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const userName = user?.fullName?.trim() || 'there';
  const selectedProduct = selectedProductSku === 'all' ? null : safeProducts.find(product => product.sku === selectedProductSku) || null;
  const algorithmProfile = { Baseline: 0.96, Seasonality: 1.08, LightGBM: 1.14 }[algorithm] || 1;
  const chartBase = selectedProduct ? Number(selectedProduct.demand || 0) : safeProducts.length ? safeProducts.reduce((sum, product) => sum + Number(product.demand || 0), 0) / safeProducts.length : 900;
  const chartConfig = {
    '7': { labels: ['Sep 01', 'Sep 03', 'Sep 05', 'Sep 07', 'Today'], actual: [0.35, 0.42, 0.51, 0.58, 0.68], forecast: [0.42, 0.46, 0.54, 0.62, 0.73] },
    '14': { labels: ['Sep 01', 'Sep 04', 'Sep 07', 'Sep 10', 'Sep 14'], actual: [0.28, 0.44, 0.57, 0.63, 0.7], forecast: [0.35, 0.51, 0.6, 0.68, 0.78] },
    '30': { labels: ['Sep 01', 'Sep 05', 'Sep 10', 'Sep 15', 'Sep 30'], actual: [0.22, 0.38, 0.53, 0.67, 0.82], forecast: [0.31, 0.45, 0.61, 0.75, 0.9] }
  };
  const activeChart = chartConfig[period] || chartConfig['7'];
  const maxValue = Math.max(...[...activeChart.actual, ...activeChart.forecast], 1) * 1.35;
  const toPoint = (value, index, values) => {
    const x = 20 + (index / (values.length - 1)) * 680;
    const y = 230 - (value / maxValue) * 180;
    return `${x},${y}`;
  };
  const actualCoordinates = activeChart.actual.map((value, index) => ({
    x: 20 + (index / (activeChart.actual.length - 1)) * 680,
    y: 230 - ((value * (chartBase / 1100)) / maxValue) * 180,
    value: value * (chartBase / 1100)
  }));
  const forecastCoordinates = activeChart.forecast.map((value, index) => ({
    x: 20 + (index / (activeChart.forecast.length - 1)) * 680,
    y: 230 - ((value * (chartBase / 1100) * algorithmProfile) / maxValue) * 180,
    value: value * (chartBase / 1100) * algorithmProfile
  }));
  const actualPoints = actualCoordinates.map(point => `${point.x},${point.y}`).join(' ');
  const forecastPoints = forecastCoordinates.map(point => `${point.x},${point.y}`).join(' ');
  const forecastAreaPath = `M ${forecastCoordinates.map(point => `${point.x},${point.y}`).join(' L ')} L 700,220 L 20,220 Z`;

  return( <section className="view active-view">
    <div className="page-heading"><div><p className="eyebrow">Year of Inventory,2026</p><h1>{greeting}, {userName} <span className="heading-wave">✦</span></h1><p className="lede">Here’s what needs your attention across <strong>24,482 SKUs</strong>.</p></div></div>
    <div className="metric-grid">{metrics.map((metric, index) => <MetricCard key={metric.label} {...metric} index={index} />)}</div>
    <div className="dashboard-grid">
      <article className="panel forecast-panel"><div className="panel-header"><div><p className="eyebrow">Demand outlook</p><h2>Forecast vs actual</h2></div><div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}><select value={selectedProductSku} onChange={event => setSelectedProductSku(event.target.value)} style={{ background: '#111827', color: '#f3f4f6', border: '1px solid rgba(148,163,184,0.35)', borderRadius: '999px', padding: '0.35rem 0.75rem', fontSize: '0.72rem' }}>
            <option value="all">All products</option>
            {safeProducts.map(product => <option key={product.sku} value={product.sku}>{product.name}</option>)}
          </select><div className="segmented">{['7', '14', '30'].map(value => <button key={value} className={`period ${period === value ? 'active' : ''}`} onClick={() => { setPeriod(value); notify(`Showing the ${value}-day demand outlook.`); }}>{value} days</button>)}</div></div></div><div className="chart-legend"><span><i className="legend-dot actual" /> Actual demand</span><span><i className="legend-line" /> Forecast</span><span className="confidence-key">{algorithm} · {period}d</span></div><div className="segmented" style={{ marginTop: '-0.1rem', marginBottom: '0.7rem', width: 'fit-content' }}>{['Baseline', 'Seasonality', 'LightGBM'].map(item => <button key={item} className={`period ${algorithm === item ? 'active' : ''}`} onClick={() => setAlgorithm(item)}>{item}</button>)}</div><div className="line-chart"><div className="y-labels"><span>{Math.round(maxValue / 1.2).toLocaleString()}</span><span>{Math.round(maxValue / 1.8).toLocaleString()}</span><span>{Math.round(maxValue / 3).toLocaleString()}</span><span>{Math.round(maxValue / 6).toLocaleString()}</span><span>0</span></div><div className="plot"><div className="grid-line g1" /><div className="grid-line g2" /><div className="grid-line g3" /><div className="grid-line g4" /><div className="grid-line g5" /><svg viewBox="0 0 720 270" preserveAspectRatio="none">
            <path className="confidence-area" d={forecastAreaPath} />
            <polyline className="actual-line" points={actualPoints} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <polyline className="forecast-line" points={forecastPoints} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {actualCoordinates.map((point, index) => <circle key={`actual-${index}`} cx={point.x} cy={point.y} r="4.5" className="actual-dot" />)}
            {forecastCoordinates.map((point, index) => <circle key={`forecast-${index}`} cx={point.x} cy={point.y} r="4.5" className="forecast-dot" />)}
          </svg><div className="x-labels">{activeChart.labels.map(label => <span key={label}>{label}</span>)}</div></div></div><div className="forecast-insight"><span className="insight-spark">✦</span><p><strong>{insightText.split('.')[0]}.</strong>{insightText.split('.').slice(1).join('.')}</p><button className="text-button" onClick={() => onNavigate('forecasts')}>View forecast details <ChevronRight size={12} /></button></div></article>
      <article className="panel distribution-panel"><div className="panel-header"><div><p className="eyebrow">Portfolio health</p><h2>Inventory distribution</h2></div></div><div className="donut-wrap"><div className="donut"><div className="donut-hole"><strong>24,482</strong><small>total SKUs</small></div></div><div className="distribution-list"><div><span className="key-dot healthy" /><span>Healthy</span><b>19,690</b><small>80.4%</small></div><div><span className="key-dot watch" /><span>Watch</span><b>4,792</b><small>19.6%</small></div><div><span className="key-dot critical" /><span>Critical</span><b>60</b><small>0.2%</small></div></div></div><div className="distribution-foot"><span className="status-dot" /> Portfolio health is <strong>above target</strong></div></article>
    </div>
    <div className="bottom-grid"><article className="panel risk-panel"><div className="panel-header"><div><p className="eyebrow">Action required</p><h2>Stockout risk</h2></div><button className="text-button" onClick={() => onNavigate('alerts')}>View all 8 <ChevronRight size={12} /></button></div><ProductTable compact products={riskProducts} onReorder={product => notify(`Reorder recommendation added for ${product.name}.`)} /></article><article className="panel movers-panel"><div className="panel-header"><div><p className="eyebrow">Demand signals</p><h2>Top movers</h2></div></div>{safeProducts.slice(3, 6).map((product, index) => <div className="mover-row" key={product.sku}><div className="mover-rank">0{index + 1}</div><div className="product-thumb bottle">◒</div><div className="mover-info"><strong>{product.name}</strong><small>{product.category}</small></div><span className={`mover-change ${index === 2 ? 'down' : 'up'}`}>{index === 2 ? '-12%' : `+${38 - index * 14}%`}</span></div>)}</article></div>
  </section>);
}
