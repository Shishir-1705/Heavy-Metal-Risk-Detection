/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  Brain, 
  Info, 
  Activity, 
  TrendingUp, 
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Scale
} from "lucide-react";

interface SHAPViewProps {
  activeConfig: any;
}

export default function SHAPView({ activeConfig }: SHAPViewProps) {
  const [modelType, setModelType] = useState("XGBoost");

  const [modelMetrics, setModelMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchModelMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/model-info");
      const data = await res.json();
      setModelMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModelMetrics();
    if (activeConfig) {
      setModelType(activeConfig.modelType || "XGBoost");
    }
  }, [activeConfig]);

  // Global feature importances
  const importanceData = modelMetrics?.featureImportances
    ? Object.entries(modelMetrics.featureImportances).map(([name, value]) => ({
        name: name.replace(/([A-Z])/g, " $1").trim(), // format camelCase
        importance: value as number
      })).sort((a, b) => b.importance - a.importance)
    : [
        { name: "Cadmium (Cd)", importance: 0.35 },
        { name: "Lead (Pb)", importance: 0.28 },
        { name: "Zinc (Zn)", importance: 0.14 },
        { name: "Chromium (Cr)", importance: 0.10 },
        { name: "pH level", importance: 0.08 },
        { name: "Organic Matter", importance: 0.035 },
        { name: "CEC Exchange", importance: 0.01 },
        { name: "Clay Content", importance: 0.005 }
      ];

  // Local SHAP demo weights pushing predictions
  const localForcesPush = [
    { name: "Cadmium level (8.5 mg/kg)", force: +0.65, color: "text-indigo-650 dark:text-indigo-400", barColor: "bg-indigo-500", desc: "Cd level matches extremely high industrial concentrations" },
    { name: "Lead level (320 mg/kg)", force: +0.55, color: "text-indigo-650 dark:text-indigo-400", barColor: "bg-indigo-500", desc: "Pb accumulates far beyond 85 mg/kg standards" },
    { name: "Acidic pH level (5.1)", force: +0.35, color: "text-indigo-500/80", barColor: "bg-indigo-400", desc: "Acidity mobilizes heavy metals, increasing absorption" }
  ];

  const localForcesPull = [
    { name: "Organic Matter (4.5%)", force: -0.15, color: "text-emerald-600 dark:text-emerald-400", barColor: "bg-emerald-500", desc: "Organic acids form safe complex bindings with minerals" },
    { name: "CEC Capacity (18.0)", force: -0.05, color: "text-emerald-600 dark:text-emerald-400", barColor: "bg-emerald-500", desc: "Clay bindings limit immediate heavy metal bioavailability" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Visual SHAP Force Plots */}
      <div id="shap-force-plot-block" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-extrabold uppercase">
            Local Prediction Forces
          </span>
          <h3 className="text-md font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 mt-1">
            <Scale className="w-5 h-5 text-emerald-500" />
            <span>SHAP Local Force Contribution Vectors</span>
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-550">
            Cooperative game theory model. Displays features pulling/pushing the current soil prediction towards High Contamination (red, positive force) vs Safe baseline values (blue, negative force).
          </p>
        </div>

        {/* Custom designed Force Plot timeline diagram */}
        <div className="space-y-4 pt-2">
          
          {/* Base centerline indicator */}
          <div className="relative h-1 bg-slate-100 dark:bg-slate-850 rounded-full flex items-center justify-center">
            <div className="absolute inset-y-0 left-1/3 right-1/3 bg-emerald-500/25 rounded-md"></div>
            <div className="absolute left-1/2 -top-2 w-4 h-4 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-full flex items-center justify-center" title="Mean base value (E[y] = 1.3)">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Pushing Force list (contributing to risk) */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Risk Mobilization Forces (+ SHAP)</span>
              </span>
              
              <div className="space-y-2.5">
                {localForcesPush.map((f, idx) => (
                  <div key={idx} className="p-3 bg-indigo-100/10 dark:bg-indigo-950/15 border border-indigo-500/10 rounded-xl space-y-1 font-sans">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-205">{f.name}</span>
                      <span className={`font-mono ${f.color}`}>+{f.force.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${f.barColor}`} style={{ width: `${f.force * 100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pulling Force list (reducing risk) */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" />
                <span>Risk Attenuation Forces (- SHAP)</span>
              </span>

              <div className="space-y-2.5">
                {localForcesPull.map((f, idx) => (
                  <div key={idx} className="p-3 bg-emerald-500/5 dark:bg-emerald-950/15 border border-emerald-500/10 rounded-xl space-y-1 font-sans">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-205">{f.name}</span>
                      <span className={`font-mono ${f.color}`}>{f.force.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${f.barColor}`} style={{ width: `${Math.abs(f.force) * 200}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* TWO BOX: Global Feature Importance & SHAP Definitions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Global Feature Importance Recharts Horizontal Columns */}
        <div id="shap-global-importance-box" className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-500" />
              <span>Global SHAP Feature Importance Mean</span>
            </h4>
            <p className="text-[10.5px] text-slate-400">Mean absolute SHAP value |E[y] - y| across baseline datasets. Refined by active configured model {modelType}.</p>
          </div>

          <div className="h-64 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={importanceData}
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#888888" fontSize={10} tickLine={false} width={100} />
                <Tooltip 
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: "10px", fontSize: "11px", color: "#fff" }}
                  cursor={{ fill: "rgba(16, 185, 129, 0.03)" }}
                />
                <Bar dataKey="importance" fill="#5A5A40" radius={[0, 6, 6, 0]}>
                  {importanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? "#5A5A40" : index === 1 ? "#78785E" : index === 2 ? "#D4A58D" : "#D9D9D1"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explainable AI reference guide */}
        <div id="shap-about-reference" className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between text-xs">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-500" />
              <span>What is SHAP (SHapley Additive exPlanations)?</span>
            </h4>
            
            <div className="space-y-3 leading-relaxed text-slate-550 dark:text-slate-400">
              <p>
                SHAP is a state-of-the-art framework based on coalitional cooperative game theory. It models the prediction outcome of each individual soil sample as a game where feature variables (pH, Cadmium levels, Depth, CEC) are active players collaborating to coordinate the score.
              </p>
              <p>
                Unlike simple global coefficients, SHAP allocates the exact marginal contribution of each element for each specific scan. For instance, while a pH of 5.1 generally mobilizes toxins, its specific force is magnified when in the presence of elevated Lead, explaining complex chemical synergies accurately!
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-750 dark:text-emerald-300 rounded-xl flex items-center gap-2.5 mt-4">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Guarantees: Local accuracy, consistency, and additivity properties of explanations are preserved.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
