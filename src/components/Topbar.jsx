import { Bell, Search } from 'lucide-react';

export default function Topbar({ context, onSearch, onAlerts }) {
  return <header className="topbar"><div className="breadcrumb"><span>Northstar Retail</span><b>/</b><strong>{context}</strong></div><div className="top-actions"><button type="button" className="icon-button" title="Search" aria-label="Search" onClick={onSearch}><Search size={18} /></button><button type="button" className="icon-button" title="Notifications" aria-label="Notifications" onClick={onAlerts}><span className="notification-dot" /><Bell size={17} /></button><button type="button" className="avatar small" aria-label="Open Jordan Avery profile">JA</button></div></header>;
}
