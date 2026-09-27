import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Network, 
  Users, 
  Target, 
  BarChart3, 
  LogOut, 
  ChevronDown, 
  Building2, 
  GraduationCap, 
  Trophy,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, organization, profile, logout, login, demoAccounts } = useAuth();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'SCHOOL':
      case 'COLLEGE':
        return <GraduationCap className="w-4 h-4 text-blue-400" />;
      case 'SPORTS_ACADEMY':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      default:
        return <Building2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Intelligence Dashboard', icon: BarChart3 },
    { id: 'hierarchy', label: 'Hierarchy Tree', icon: Network },
    { id: 'people', label: 'People Directory', icon: Users },
    { id: 'tasks', label: 'Tasks & Recommendations', icon: Target },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Org Badge */}
          <div className="flex items-center space-x-4">
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Talent<span className="text-indigo-400">OS</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Potential Intel
                </span>
              </div>
            </div>

            {/* Current Organization Tag */}
            {organization && (
              <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-800 text-xs text-slate-300">
                {getOrgIcon(organization.type)}
                <span className="font-semibold text-slate-200">{organization.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                  {organization.type}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Demo Switcher & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Switch Role:</span>
                <span className="text-white font-semibold">{profile?.firstName || user?.role}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-700/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Test Persona
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-700/40">
                    {demoAccounts.map((acc, idx) => (
                      <button
                        key={idx}
                        onClick={async () => {
                          setShowDemoMenu(false);
                          await login(acc.email, acc.password);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-indigo-600/20 transition-colors ${
                          user?.email === acc.email ? 'bg-indigo-900/30 border-l-2 border-indigo-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{acc.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-700 text-slate-300">
                            {acc.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {acc.title} • {acc.orgName}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around py-2.5 border-t border-slate-800/80 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center px-3 py-1 text-xs font-medium ${
                  isActive ? 'text-indigo-400' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
