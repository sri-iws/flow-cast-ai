import { Bell, Boxes, ChevronDown, ClipboardList, LayoutDashboard, Settings, Upload, Waves } from 'lucide-react';
import { navItems } from '../data';

const icons = { overview: LayoutDashboard, products: Boxes, forecasts: Waves, alerts: Bell, orders: ClipboardList, data: Upload, settings: Settings };

export default function Sidebar({ view, onNavigate }) {
  return <aside className="sidebar">
    <div className="brand-lockup"><div className="brand-mark"><span /><span /><span /></div><div><strong style={{color: "black"}}>flow cast</strong><small>inventory intelligence</small></div></div>
    <div className="workspace-switcher"><span className="workspace-dot" /><div><small>Workspace</small><strong style={{color: "black"}}>Northstar Retail</strong></div><ChevronDown className="chevron" size={15} /></div>
    <nav className="main-nav" aria-label="Main navigation"><p className="nav-label">Workspace</p>{navItems.slice(0, 5).map(([id, label]) => { const Icon = icons[id]; return <button key={id} type="button" className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => onNavigate(id)} aria-current={view === id ? 'page' : undefined}><Icon className="nav-icon" size={16} />{label}{id === 'alerts' && <b className="nav-count">8</b>}</button>; })}<p className="nav-label secondary-label">Manage</p>{navItems.slice(5).map(([id, label]) => { const Icon = icons[id]; return <button key={id} type="button" className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => onNavigate(id)} aria-current={view === id ? 'page' : undefined}><Icon className="nav-icon" size={16} />{label}</button>; })}</nav>
    <div className="sidebar-footer"><div className="model-status"><span className="status-dot" /><div><strong>Forecast engine</strong><small>LightGBM · synced 8m ago</small></div></div><div className="user-card"><div className="avatar" aria-label="Jordan Avery profile">JA</div><div><strong>Jordan Avery</strong><small>Operations lead</small></div><span aria-label="More actions">•••</span></div></div>
  </aside>;
}
