import { Bell, Boxes, ChevronDown, ClipboardList, LayoutDashboard, Settings, Upload, Waves } from 'lucide-react';
import { navItems } from '../data';

const icons = { overview: LayoutDashboard, products: Boxes, forecasts: Waves, alerts: Bell, orders: ClipboardList, data: Upload, settings: Settings };

export default function Sidebar({ view, onNavigate, user, allowedViews = navItems.map(([id]) => id) }) {
  const initials = (user?.fullName || 'User').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'U';
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';
  const visibleItems = navItems.filter(([id]) => allowedViews.includes(id));

  return <aside className="sidebar">
    <div className="brand-lockup"><div className="brand-mark"><span /><span /><span /></div><div><strong style={{color: "cream"}}>flow cast</strong><small>inventory intelligence</small></div></div>
    <div className="workspace-switcher"><span className="workspace-dot" /><div><small>Workspace</small><strong style={{color: "black"}}>Northstar Retail</strong></div><ChevronDown className="chevron" size={15} /></div>
    <nav className="main-nav" aria-label="Main navigation"><p className="nav-label">Workspace</p>{visibleItems.slice(0, 5).map(([id, label]) => { const Icon = icons[id]; return <button key={id} type="button" className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => onNavigate(id)} aria-current={view === id ? 'page' : undefined}><Icon className="nav-icon" size={16} />{label}{id === 'alerts' && <b className="nav-count">8</b>}</button>; })}<p className="nav-label secondary-label">Manage</p>{visibleItems.slice(5).map(([id, label]) => { const Icon = icons[id]; return <button key={id} type="button" className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => onNavigate(id)} aria-current={view === id ? 'page' : undefined}><Icon className="nav-icon" size={16} />{label}</button>; })}</nav>
    <div className="sidebar-footer"><div className="model-status"><span className="status-dot" /><div><strong>Forecast engine</strong><small>LightGBM · synced 8m ago</small></div></div><div className="user-card"><div className="avatar" aria-label="User profile">{initials}</div><div><strong>{user?.fullName || 'User'}</strong><small>{roleLabel}</small></div><span aria-label="More actions">•••</span></div></div>
  </aside>;
}
