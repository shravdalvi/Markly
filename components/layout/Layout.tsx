import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Link, useLocation } from 'react-router-dom';

declare const gsap: any;

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, active, collapsed }) => (
  <Link
    to={to}
    className={`group flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 text-sm font-medium rounded-lg transition-all duration-200 mb-1.5 relative ${active
      ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    title={collapsed ? label : undefined}
  >
    <span className={`${collapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
      {icon}
    </span>
    {!collapsed && <span>{label}</span>}

    {/* Active Indicator for collapsed state */}
    {collapsed && active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
    )}
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Entry animation
  useEffect(() => {
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(".layout-content", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    }
  }, [location.pathname]);

  if (!user) return null;

  const getNavItems = () => {
    const commonItems = [
      { to: '/dashboard', label: 'Dashboard', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    ];

    const profileItem = { to: '/profile', label: 'Profile', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> };

    if (user.role === UserRole.STUDENT) {
      return [
        ...commonItems,
        { to: '/attendance', label: 'My Attendance', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
        profileItem
      ];
    }

    if (user.role === UserRole.LEAD) {
      return [
        ...commonItems,
        { to: '/create-meeting', label: 'Create Meeting', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11v4m-2-2h4" /></svg> },
        { to: '/mark-attendance', label: 'Mark Attendance', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { to: '/directory', label: 'Committee Members', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
        profileItem
      ];
    }

    if (user.role === UserRole.FACULTY) {
      return [
        ...commonItems,
        { to: '/conflicts', label: 'Conflicts', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
        { to: '/directory', label: 'Committee Directory', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
        profileItem
      ];
    }

    return [...commonItems, profileItem];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex bg-bg-DEFAULT">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-bg-sidebar text-slate-400 border-r border-slate-800 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} h-screen sticky top-0 z-50`}>
        {/* Logo Area */}
        <div className={`h-16 flex items-center ${collapsed ? 'justify-center' : 'justify-between px-6'} border-b border-slate-800`}>
          {!collapsed && (
            <span className="font-bold text-white text-lg tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm shadow-lg shadow-primary-900/50">M</span>
              Markly
            </span>
          )}
          {collapsed && (
            <span className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm font-bold">M</span>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-white transition-colors ${collapsed ? 'hidden' : 'block'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        </div>

        {/* Collapsed Toggle (when collapsed) */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-4 p-2 rounded-md hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </button>
        )}

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-3 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                {...item}
                active={location.pathname === item.to}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className={`p-4 border-t border-slate-800 bg-slate-900/50`}>
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-slate-200 truncate">{user.name}</span>
                  <span className="text-xs text-slate-500 truncate capitalize">{user.role.toLowerCase()}</span>
                </div>
              </div>
              <button onClick={logout} className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Sign Out">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Link to="/profile" className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white hover:border-slate-500 transition-colors" title="Profile">
                {user.name.charAt(0)}
              </Link>
              <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors" title="Sign Out">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <span className="w-8 h-8 rounded bg-primary-600 text-white flex items-center justify-center text-sm">M</span>
          Markly
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-slate-900 border-l border-slate-800 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-white font-bold text-xl">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block py-3 px-4 rounded-lg text-sm font-medium ${location.pathname === item.to ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5">{item.icon}</span>
                    {item.label}
                  </div>
                </Link>
              ))}
              <button
                onClick={logout}
                className="w-full text-left py-3 px-4 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 flex items-center gap-3 mt-8 border-t border-slate-800 pt-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pt-16 md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth layout-content">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};