import { Bell, LogOut, Search } from 'lucide-react';

export default function Topbar({ context, user, onSearch, onAlerts, onLogout }) {
  const initials = (user?.fullName || 'User').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() || 'U';

  return <header className="topbar"><div className="breadcrumb"><span>Northstar Retail</span><b>/</b><strong>{context}</strong></div><div className="top-actions"><button type="button" className="icon-button" title="Search" aria-label="Search" onClick={onSearch}><Search size={18} /></button><button type="button" className="icon-button" title="Notifications" aria-label="Notifications" onClick={onAlerts}><span className="notification-dot" /><Bell size={17} /></button><button type="button" className="avatar small" aria-label="Open account profile">{initials}</button><button type="button" className="icon-button logout-button" title="Log out" aria-label="Log out" onClick={onLogout}><LogOut size={16} /></button></div></header>;
}
