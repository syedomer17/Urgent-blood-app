import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV = [
  {
    href: '/', label: 'Home', icon: (a: boolean) => (
      <svg className="w-6 h-6" fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={a ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  {
    href: '/requests', label: 'Requests', icon: (a: boolean) => (
      <svg className="w-6 h-6" fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={a ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )
  },
  {
    href: '/donors', label: 'Donors', icon: (a: boolean) => (
      <svg className="w-6 h-6" fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={a ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    href: '/profile', label: 'Profile', icon: (a: boolean) => (
      <svg className="w-6 h-6" fill={a ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={a ? 0 : 2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
];

export const BottomNav: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white"
      style={{
        boxShadow: '0 -1px 0 rgba(0,0,0,0.06), 0 -4px 20px rgba(0,0,0,0.05)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch max-w-sm mx-auto">
        {NAV.map(({ href, label, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <NavLink
              key={href}
              to={href}
              end={href === '/'}
              className="flex-1 flex flex-col items-center justify-center pt-3 pb-2 gap-0.5 relative transition-all"
              style={{ color: isActive ? '#e74c3c' : '#9ca3af' }}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full"
                  style={{ background: '#e74c3c' }}
                />
              )}
              {icon(isActive)}
              <span className="text-[10px] font-bold mt-0.5">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
