/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Settings, 
  Layers, 
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  TrendingUp,
  Cpu
} from "lucide-react";

interface PerformanceViewProps {
  onUpdateModelConfig: (config: { modelType: string; balancingMethod: string; optimizerType: string }) => Promise<any>;
  activeConfig: any;
}

export default function PerformanceView({ onUpdateModelConfig, activeConfig }: PerformanceViewProps) {
  const [modelType, setModelType] = useState("XGBoost");
  const [balancingMethod, setBalancingMethod] = useState("ADASYN");
  const [optimizerType, setOptimizerType] = useState("Optuna Optimization");

  const [isTuning, setIsTuning] = useState(false);
  const [tuningDone, setTuningDone] = useState<any | null>(null);
  const [tuningError, setTuningError] = useState("");

  const [metricsResponse, setMetricsResponse] = useState<any | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);

  const fetchPerformanceMetrics = async () => {
    setIsMetricsLoading(true);
    try {
      const res = await fetch("/api/metrics");
      const data = await res.json();
      setMetricsResponse(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMetricsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceMetrics();
    if (activeConfig) {
      setModelType(activeConfig.modelType || "XGBoost");
      setBalancingMethod(activeConfig.balancingMethod || "ADASYN");
      setOptimizerType(activeConfig.optimizerType || "Optuna Optimization");
    }
  }, [activeConfig, tuningDone]);

  const handleTuningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTuning(true);
    setTuningError("");
    setTuningDone(null);

    try {
      const res = await onUpdateModelConfig({ modelType, balancingMethod, optimizerType });
      setTuningDone(res);
    } catch (err: any) {
      setTuningError(err.message || "Failed model optimization sweeps.");
    } finally {
      setIsTuning(false);
    }
  };

  // Balancing compare matrix
  const compareMatrix = metricsResponse?.balancedComparison || [
    { modelType: "XGBoost", balancingMethod: "ADASYN", balancedAccuracy: 0.89, f1Score: 0.88 },
    { modelType: "XGBoost", balancingMethod: "SMOTE", balancedAccuracy: 0.87, f1Score: 0.86 },
    { modelType: "XGBoost", balancingMethod: "None", balancedAccuracy: 0.74, f1Score: 0.71 },
    { modelType: "Random Forest", balancingMethod: "Borderline SMOTE", balancedAccuracy: 0.86, f1Score: 0.85 },
    { modelType: "Logistic Regression", balancingMethod: "None", balancedAccuracy: 0.62, f1Score: 0.59 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Dynamic model optimization controller Form */}
      <div id="recalibration-form-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleTuningSubmit} className="space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h3 className="text-md font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-500" />
                <span>Hyperparameter Optimization Control Panel</span>
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Switch classifiers or balancing policies to command the server-side Optuna Bayesian Optimization engine or Randomized Searches.
              </p>
            </div>
            {activeConfig && (
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-850 dark:text-slate-400 px-3 py-1.5 rounded-xl font-bold">
                ACTIVE CONFIGURATION: {activeConfig.modelType} | {activeConfig.balancingMethod}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Classifier Dropdown Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Classification Estimator model
              </label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="Logistic Regression">Logistic Regression (L1/L2 Regularized)</option>
                <option value="Random Forest">Random Forest Classifiers</option>
                <option value="XGBoost">Extreme Gradient Boosting (XGBoost)</option>
                <option value="LightGBM">Light Gradient Boosting (LightGBM)</option>
                <option value="CatBoost">Categorical Boosting (CatBoost)</option>
                <option value="Extra Trees">Extra Trees Ensemble</option>
                <option value="Gradient Boosting">Gradient Boosting Estimators</option>
                <option value="SVM">Support Vector Machines (SVM)</option>
              </select>
            </div>

            {/* Oversampling Balancing Selection */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Oversampling Balancing Method
              </label>
              <select
                value={balancingMethod}
                onChange={(e) => setBalancingMethod(e.target.value)}
                className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="None">None (Imbalanced Training)</option>
                <option value="SMOTE">SMOTE (Standard Interpolation)</option>
                <option value="Borderline SMOTE">Borderline SMOTE (Boundary Density)</option>
                <option value="ADASYN">ADASYN (Adaptive Allocation)</option>
              </select>
            </div>

            {/* Optimizer Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Tuning Sweep Optimizer
              </label>
              <select
                value={optimizerType}
                onChange={(e) => setOptimizerType(e.target.value)}
                className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="Randomized Search">Randomized Search (10 Trials)</option>
                <option value="Optuna Optimization">Optuna Bayesian Sweep (15 Trials + Pruners)</option>
              </select>
            </div>

          </div>

          {tuningError && (
            <div className="flex gap-2.5 p-3 px-4 rounded-xl text-xs bg-red-50 text-red-750 border border-red-200 dark:bg-red-950/20 dark:text-red-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{tuningError}</span>
            </div>
          )}

          {tuningDone && (
            <div className="flex gap-2.5 p-4 bg-emerald-50 text-emerald-750 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 rounded-xl text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="font-extrabold text-sm">Automated TPE trials complete. Optimal pipeline deployed!</p>
                <p className="text-[10px] mt-1 font-mono">Best Parameters: {JSON.stringify(tuningDone.activeModelConfig.hyperparameters)}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isTuning}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 font-bold text-xs tracking-wider text-white border border-emerald-500/15 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 dark:disabled:bg-slate-850"
          >
            <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{isTuning ? "RUNNING MODEL SELECTION & CROSS VALIDATIONS..." : "CONVERGE PIPELINE ENGINE"}</span>
          </button>
        </form>
      </div>

      {/* TWO COLUMN LOGS & COMPARISONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Comparison grid logs */}
        <div id="comparison-grid-panel" className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-500" />
              <span>Pipeline Comparison Matrix</span>
            </h4>
            <p className="text-[10px] text-slate-400">Balanced Accuracies from cross validation. Notice oversamplers (SMOTE/ADASYN) beat raw distributions.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-405 border-b border-slate-150 dark:border-slate-850">
                  <th className="px-4 py-2">Model</th>
                  <th className="px-4 py-2">Balancing</th>
                  <th className="px-4 py-2 text-right">Balanced Accuracy</th>
                  <th className="px-4 py-2 text-right">F1 Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {compareMatrix.map((item: any, idx: number) => {
                  const isWinning = item.balancedAccuracy > 0.85;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-slate-750 dark:text-slate-350">
                      <td className="px-4 py-3 font-semibold">{item.modelType}</td>
                      <td className="px-4 py-3 font-mono text-[10px]">
                        <span className={`px-2 py-0.5 rounded ${item.balancingMethod === "None" ? "bg-slate-100 dark:bg-slate-950 text-slate-500" : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 font-semibold"}`}>
                          {item.balancingMethod}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${isWinning ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                        {(item.balancedAccuracy * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{(item.f1Score * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Optuna Sequential Trials Trace Logs */}
        <div id="trial-trace-panel" className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Optuna Bayesian Trial Traces</span>
            </h4>
            <p className="text-[10px] text-slate-400">Sequential tuning trials trace logs displaying parameter selections, accuracy scores, and pruners.</p>
          </div>

          <div className="space-y-2.5 max-h-[295px] overflow-y-auto">
            {metricsResponse?.trials ? (
              metricsResponse.trials.map((trial: any) => (
                <div key={trial.trialId} className={`p-3 border rounded-xl text-xs flex justify-between items-center ${trial.isPruned ? "bg-red-500/5 border-red-500/10 text-slate-400" : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850"}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="font-mono text-[10px] font-bold text-emerald-600">Trial #{trial.trialId}</span>
                      {trial.isPruned ? (
                        <span className="text-[8px] bg-red-100 dark:bg-red-950/50 text-red-650 px-1.5 py-0.5 rounded uppercase font-bold">Pruned early</span>
                      ) : (
                        <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 px-1.5 py-0.5 rounded uppercase font-bold">Converged</span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 max-w-[200px] truncate font-mono">
                      {JSON.stringify(trial.parameters)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Val B-Acc</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-150">{(trial.balancedAccuracy * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                Activate parameters optimizer above to trace trials history.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
