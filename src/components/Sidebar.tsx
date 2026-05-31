/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Sprout, 
  Activity, 
  BarChart3, 
  Brain, 
  Info,
  Layers,
  Sun,
  Moon,
  User,
  LogOut,
  Sliders,
  FolderLock
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  user: any;
  onAuthClick: () => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  darkMode, 
  setDarkMode, 
  user, 
  onAuthClick, 
  onLogout 
}: SidebarProps) {
  
  const navItems = [
    { id: "home", label: "Dashboard Hub", icon: Sprout },
    { id: "predict", label: "Soil Risk Predictor", icon: Sliders },
    { id: "analytics", label: "Dataset Analytics", icon: BarChart3 },
    { id: "performance", label: "Model Comparison", icon: Layers },
    { id: "shap", label: "SHAP Explainable AI", icon: Brain },
    { id: "about", label: "Environmental Criteria", icon: Info }
  ];

  return (
    <aside id="sidebar-layout-container" className="h-screen w-64 bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 flex flex-col shrink-0 sticky top-0 transition-colors duration-350">
      
      {/* Platform Branding */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-900">
        <h1 className="text-lg font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-2">
          <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xs font-sans font-extrabold uppercase shrink-0">
            AG
          </span>
          AgriGuard ML
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1 font-bold">
          Soil Contamination Monitoring
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 mb-2.5">
          Core Workspaces
        </p>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-item-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                isActive 
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-emerald-500 hover:bg-slate-200 dark:text-emerald-400 dark:hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-white" : "text-emerald-500 dark:text-emerald-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session and Global Properties */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-900 space-y-3 mt-auto">
        
        {/* API Status styled like design */}
        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">API Status</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-xs text-emerald-500 dark:text-emerald-400 font-bold font-mono leading-none">v1.2.0-Production</p>
        </div>

        {/* Dark & Light Theme Toggle button */}
        <div className="flex justify-between items-center bg-slate-250/50 dark:bg-slate-900/40 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400">
          <span className="text-xs">Visual Theme</span>
          <button
            id="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* User Card */}
        {user ? (
          <div className="flex items-center justify-between p-3 bg-slate-250/50 dark:bg-slate-900/40 rounded-xl text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-emerald-500 text-white rounded-lg font-bold leading-none shrink-0">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-3 text-[11px]">
                  {user.username}
                </p>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono italic">
                  Agronomist
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout Session"
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onAuthClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-200/50 dark:hover:bg-slate-900/40 transition-all cursor-pointer animate-pulse"
          >
            <FolderLock className="w-4 h-4 text-emerald-500" />
            <span>Expert Portal Login</span>
          </button>
        )}
      </div>
    </aside>
  );
}
