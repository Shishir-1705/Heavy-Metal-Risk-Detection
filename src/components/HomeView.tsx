/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  Clock, 
  Sparkles,
  Search,
  BookOpen,
  Filter
} from "lucide-react";
import { PredictionHistoryRecord } from "../types";

interface HomeViewProps {
  predictionCount: number;
  activeModelName: string;
  accuracyRate: number;
  balancingMethod: string;
  predictionLogs: PredictionHistoryRecord[];
  onClearHistory: () => void;
  onNavigateToPredict: () => void;
  user: any;
}

export default function HomeView({
  predictionCount,
  activeModelName,
  accuracyRate,
  balancingMethod,
  predictionLogs,
  onClearHistory,
  onNavigateToPredict,
  user
}: HomeViewProps) {
  
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const filteredLogs = predictionLogs.filter((log) => {
    const sTerm = searchTerm.toLowerCase();
    const matchesSearch = 
      log.prediction.riskClass.toLowerCase().includes(sTerm) ||
      log.features.landUse.toLowerCase().includes(sTerm);

    const matchesFilter = classFilter === "all" || log.prediction.riskClass === classFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Dynamic Welcome & Threat Alert Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 to-indigo-900 rounded-2xl text-white p-6 shadow-lg border border-emerald-700/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full -ml-16 -mb-16 blur-xl"></div>
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-400/20 text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SoilRisk Scientific ML Console</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Heavy Metal Contamination Risk Classification system
          </h2>
          <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
            Evaluate and mitigate heavy metal toxicity hazards in agricultural soil. Upload custom datasets, compare structural oversampling algorithms (SMOTE/ADASYN) across 8 classification estimators, and utilize Explainable AI to manage land health.
          </p>
          
          <button
            onClick={onNavigateToPredict}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs rounded-xl shadow-md tracking-wider transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>EXAMINE A NEW SAMPLE</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div id="kpi-predictions" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest block">
              Cumulative Scans
            </span>
            <span className="text-2xl font-bold text-slate-850 dark:text-slate-100 font-mono">
              {predictionCount}
            </span>
          </div>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div id="kpi-model" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest block">
              Active Classifier
            </span>
            <span className="text-md font-bold text-slate-850 dark:text-slate-100 truncate max-w-[150px] block">
              {activeModelName}
            </span>
          </div>
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 rounded-xl text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div id="kpi-accuracy" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest block">
              Balanced Accuracy
            </span>
            <span className="text-2xl font-bold text-slate-850 dark:text-slate-100 font-mono">
              {(accuracyRate * 100).toFixed(1)}%
            </span>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-950/40 rounded-xl text-amber-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div id="kpi-balancing" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest block">
              Balancing Policy
            </span>
            <span className="text-sm font-bold text-slate-850 dark:text-slate-100 block">
              {balancingMethod}
            </span>
          </div>
          <div className="p-3 bg-purple-100 dark:bg-purple-950/40 rounded-xl text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Audit Logs Table Section */}
      <div id="audit-logs-workspace" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table Headers and searching tools */}
        <div className="p-6 border-b border-slate-150 dark:border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-md font-bold text-slate-850 dark:text-slate-100">
              Contamination Audit Logs
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Audit trail showing all historical runs performed during user sessions.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search scans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-1.5 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-none border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-850">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-0"
              >
                <option value="all">Fractions: All</option>
                <option value="Safe Risk">Safe Risks</option>
                <option value="Moderate Risk">Moderate Risks</option>
                <option value="High Risk">High Risks</option>
              </select>
            </div>

            {/* Clear Button */}
            {predictionLogs.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-3 py-1.5 rounded-xl hover:bg-red-50 text-slate-450 hover:text-red-650 dark:hover:bg-red-950/20 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Logs</span>
              </button>
            )}
          </div>
        </div>

        {/* Data list Table */}
        <div className="overflow-x-auto">
          {filteredLogs.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-150 dark:border-slate-850">
                  <th className="px-6 py-3">Scan Code</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Cadmium (Cd)</th>
                  <th className="px-6 py-3">Lead (Pb)</th>
                  <th className="px-6 py-3">Zinc (Zn)</th>
                  <th className="px-6 py-3">pH</th>
                  <th className="px-6 py-3">Land History</th>
                  <th className="px-6 py-3">Assigned Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {filteredLogs.map((log) => {
                  const rClass = log.prediction.riskClass;
                  const isHigh = rClass === "High Risk";
                  const isMod = rClass === "Moderate Risk";
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-slate-700 dark:text-slate-350">
                      <td className="px-6 py-4 font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400">
                        {log.id}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-1.5 text-slate-450">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium">{log.features.cadmium} mg/kg</td>
                      <td className="px-6 py-4 font-mono font-medium">{log.features.lead} mg/kg</td>
                      <td className="px-6 py-4 font-mono font-medium">{log.features.zinc} mg/kg</td>
                      <td className="px-6 py-4 font-mono font-medium">{log.features.ph}</td>
                      <td className="px-6 py-4 font-medium">{log.features.landUse}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                          isHigh 
                            ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200" 
                            : isMod 
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                        }`}>
                          {isHigh ? <ShieldAlert className="w-3 h-3 text-red-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          <span>{rClass}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No scans logged in current query</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                Try scanning an agricultural sample under the Risk Predictor or clear filters to showcase your audit records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
