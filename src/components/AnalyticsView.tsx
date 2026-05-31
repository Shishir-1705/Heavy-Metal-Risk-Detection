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
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from "recharts";
import { 
  Upload, 
  Database, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  FileSpreadsheet
} from "lucide-react";
import { UploadedDatasetRecord } from "../types";

interface AnalyticsViewProps {
  onUploadDataset: (filename: string, samples: any[]) => Promise<any>;
  uploadedDatasets: UploadedDatasetRecord[];
}

// Pre-cooked Mock CSV soils dataset paste-in for effortless user clicks
const SAMPLE_CSV_PASTE = `depth,landUse,ph,organicMatter,clayContent,cec,lead,cadmium,zinc,chromium
10,Agriculture,5.20,2.10,18,15,55,1.20,130,42
45,Industrial,4.90,1.20,40,22,250,6.50,550,140
15,Forest,6.80,6.20,28,32,15,0.08,40,15
30,Residential,6.10,3.50,22,14,75,0.40,95,30
20,Agriculture,5.80,4.10,15,12,30,0.50,110,40
60,Industrial,5.50,1.55,38,19,190,4.20,380,95
25,Forest,7.20,5.80,30,28,12,0.05,35,18
35,Residential,6.40,2.80,24,11,88,0.30,120,45`;

export default function AnalyticsView({ onUploadDataset, uploadedDatasets }: AnalyticsViewProps) {
  const [csvContent, setCsvContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState("");

  const [metricsData, setMetricsData] = useState<any | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  const fetchAnalyticsMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await fetch("/api/metrics");
      const data = await res.json();
      setMetricsData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsMetrics();
  }, [uploadSuccess]);

  // Handle CSV parser logic
  const handleCSVSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess(null);
    setIsUploading(true);

    if (!csvContent.trim()) {
      setUploadError("CSV content field is empty.");
      setIsUploading(false);
      return;
    }

    try {
      const lines = csvContent.split("\n").filter(l => l.trim() !== "");
      if (lines.length < 2) {
        throw new Error("Must provide head titles and at least 1 record row.");
      }

      const headers = lines[0].split(",").map(h => h.trim());
      const samples: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        if (values.length !== headers.length) continue;

        const obj: any = {};
        headers.forEach((h, hIdx) => {
          obj[h] = values[hIdx];
        });
        samples.push(obj);
      }

      if (samples.length === 0) {
        throw new Error("Could not parse any valid CSV soil rows.");
      }

      // Upload and retrain automatically
      const res = await onUploadDataset("soil_recalib_batch.csv", samples);
      setUploadSuccess(res);
      setCsvContent("");
    } catch (err: any) {
      setUploadError(err.message || "Failed parsing CSV schema. Check columns headers.");
    } finally {
      setIsUploading(false);
    }
  };

  // Convert recharts friendly format
  const distributionData = metricsData?.classDistribution 
    ? Object.entries(metricsData.classDistribution).map(([name, value]) => ({ name, value }))
    : [
        { name: "Safe Risk", value: 165 },
        { name: "Moderate Risk", value: 60 },
        { name: "High Risk", value: 25 }
      ];

  // Dummy scatter correlations for pH vs Cd
  const scatterPoints = [
    { ph: 4.8, cadmium: 8.5 },
    { ph: 5.2, cadmium: 6.2 },
    { ph: 5.5, cadmium: 4.5 },
    { ph: 6.0, cadmium: 1.5 },
    { ph: 6.5, cadmium: 0.8 },
    { ph: 7.2, cadmium: 0.1 },
    { ph: 7.8, cadmium: 0.05 },
    { ph: 8.2, cadmium: 0.12 },
    { ph: 4.5, cadmium: 9.8 },
    { ph: 5.0, cadmium: 5.5 },
    { ph: 5.8, cadmium: 2.2 },
    { ph: 6.3, cadmium: 1.1 },
    { ph: 6.9, cadmium: 0.4 },
    { ph: 7.5, cadmium: 0.15 },
    { ph: 8.0, cadmium: 0.08 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Retraining uploads & Dropzone console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CSV Copy-paste console */}
        <div id="mlops-recalibrator" className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
            <div>
              <h3 className="text-md font-bold text-slate-850 dark:text-slate-100">
                Data Integration & Automated ML Refined Hooks
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Upload raw soil csv registers. The pipeline will parse, normalize, winsorize, and recalibrate model hyperparameters dynamically on trigger.
              </p>
            </div>
            <button
              onClick={() => setCsvContent(SAMPLE_CSV_PASTE)}
              className="text-xs px-2.5 py-1.5 rounded-xl text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20 font-semibold border border-dashed border-emerald-300 dark:border-emerald-750 flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Paste Soil Demo</span>
            </button>
          </div>

          <form onSubmit={handleCSVSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                Comma Separated CSV soil coordinates (Values)
              </label>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="depth,landUse,ph,organicMatter,clayContent,cec,lead,cadmium,zinc,chromium..."
                className="w-full p-4 rounded-xl font-mono text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {uploadError && (
              <div className="flex gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-300 rounded-xl text-xs border border-red-200">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="flex gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-750 dark:text-emerald-300 rounded-xl text-xs border border-emerald-250">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">ML Pipeline Retrained Successfully!</p>
                  <p className="text-[10px] mt-0.5">Optuna Bayesian Sweep converged. Accuracy: {(uploadSuccess.retrainingReport.crossValidationAccuracy * 100).toFixed(1)}%, Model configuration parameters updated.</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-205 dark:disabled:bg-slate-800 font-bold text-xs tracking-wider rounded-xl transition-all shadow-md text-white border border-emerald-500 cursor-pointer"
            >
              {isUploading ? "REFITTING MODELS WITH OPTUNA TRIAL SWEEPS..." : "SUBMIT DATASET & RETRAIN PIPELINE"}
            </button>
          </form>
        </div>

        {/* Uploaded Datasets History Registry */}
        <div id="datasets-log-card" className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Dataset Registry Logs</span>
            </h3>
            
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {uploadedDatasets.length > 0 ? (
                uploadedDatasets.map((ds) => (
                  <div key={ds.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-850 dark:text-slate-150 truncate max-w-[150px]">{ds.filename}</span>
                      <span className="font-mono text-[9px] text-emerald-600 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded-md">{ds.rowCount} sets</span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>pH Average: {ds.summary.phMean}</span>
                      <span>OM Average: {ds.summary.organicMatterMean}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-550 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                  No custom datasets registered. Standard baseline active (250 soils samples).
                </div>
              )}
            </div>
          </div>

          <div id="database-integrity-badge" className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 text-indigo-750 dark:text-indigo-300 rounded-xl text-[10px] flex items-center gap-2 mt-4">
            <Activity className="w-4 h-4 animate-pulse shrink-0" />
            <span>Database Integrity: Normal operations (SQL Simulation active, SQLite storage persistent)</span>
          </div>
        </div>

      </div>

      {/* CHARTS CONTAINER GRID */}
      <div id="analytics-charts-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Class distribution */}
        <div id="chart-class-distribution" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
              Imbalanced Class Distribution (Count)
            </h4>
            <p className="text-[10px] text-slate-400">Representation of target soil labels in base research dataset.</p>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: "10px", fontSize: "12px", color: "#fff" }}
                  cursor={{ fill: "rgba(16, 185, 129, 0.05)" }}
                />
                <Bar dataKey="value" fill="#5A5A40" radius={[8, 8, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === "High Risk" ? "#A0522D" : entry.name === "Moderate Risk" ? "#D4A58D" : "#5A5A40"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* pH vs Cadmium Scatter correlation chart */}
        <div id="chart-scatter-relation" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
              pH Bioavailability vs Cadmium (Cd) Scatter Relation
            </h4>
            <p className="text-[10px] text-slate-400">Transition states: Acidic soil accelerates high mobilization risks.</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <XAxis type="number" dataKey="ph" name="Soil pH" stroke="#888888" fontSize={11} />
                <YAxis type="number" dataKey="cadmium" name="Cadmium" unit="mg" stroke="#888888" fontSize={11} />
                <ZAxis type="number" range={[60, 200]} />
                <Tooltip 
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={{ background: "#1e293b", border: "none", borderRadius: "10px", fontSize: "11px", color: "#fff" }}
                />
                <Scatter name="Soils samples" data={scatterPoints} fill="#D4A58D">
                  {scatterPoints.map((entry, index) => {
                    const isHighRisk = entry.cadmium > 1.4 || (entry.ph < 5.5 && entry.cadmium > 0.8);
                    return <Cell key={`cell-${index}`} fill={isHighRisk ? "#A0522D" : "#5A5A40"} opacity={0.7} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Custom Heatmap of Pearson Correlations (Using grid system for premium design) */}
        <div id="chart-correlation-heatmap" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 md:col-span-2">
          <div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
              Soil Attributes Pearson Correlation Heatmap matrix
            </h4>
            <p className="text-[10px] text-slate-400">Interaction grid coefficients. Warm colors (red) map strong positive correlations, cool colors map negative dependencies.</p>
          </div>

          {metricsData?.correlationMatrix ? (
            <div className="overflow-x-auto select-none">
              <div className="min-w-[650px] space-y-1">
                {/* Headers line */}
                <div className="grid grid-cols-10 text-[9px] font-bold uppercase text-slate-405 dark:text-slate-500 font-mono text-center">
                  <div className="text-left font-sans text-[10px] font-bold text-slate-800 dark:text-slate-200">Variables</div>
                  {metricsData.correlationMatrix.headers.map((h: string) => (
                    <div key={h} className="truncate px-1">{h}</div>
                  ))}
                </div>
                
                {/* grid matrices */}
                {metricsData.correlationMatrix.matrix.map((row: number[], rIdx: number) => {
                  const rHeader = metricsData.correlationMatrix.headers[rIdx];
                  return (
                    <div key={rIdx} className="grid grid-cols-10 items-center font-mono text-xs">
                      {/* Left header column */}
                      <div className="text-left font-sans font-semibold text-slate-700 dark:text-slate-350 truncate pr-2 text-[10px]">
                        {rHeader}
                      </div>

                      {/* correlation squares */}
                      {row.map((coef: number, cIdx: number) => {
                        // Compute color matches based on correlation intensity
                        // Strong Positive: Red/Orange. Strong Negative: Indigo/Purple/Blue. Neutral: Offwhite
                        let bgStyle = "";
                        let textStyle = "text-slate-800 dark:text-slate-100";
                        if (coef > 0.6) {
                          bgStyle = "bg-red-500/80 dark:bg-red-650/80";
                          textStyle = "text-white font-bold";
                        } else if (coef > 0.3) {
                          bgStyle = "bg-amber-400/60 dark:bg-amber-500/50";
                          textStyle = "text-slate-900 dark:text-slate-100 font-bold";
                        } else if (coef < -0.4) {
                          bgStyle = "bg-indigo-500/40 dark:bg-indigo-950/60";
                          textStyle = "text-indigo-800 dark:text-indigo-300 font-semibold";
                        } else if (coef < -0.1) {
                          bgStyle = "bg-blue-300/30 dark:bg-blue-900/20";
                          textStyle = "text-blue-700 dark:text-blue-300";
                        } else {
                          bgStyle = "bg-slate-100 dark:bg-slate-950 text-slate-500";
                        }

                        return (
                          <div
                            key={cIdx}
                            className={`p-2.5 text-center text-[10px] rounded-md border border-white/5 mx-0.5 transition-all ${bgStyle} ${textStyle}`}
                            title={`Corr(${rHeader}, ${metricsData.correlationMatrix.headers[cIdx]}): ${coef}`}
                          >
                            {coef > 0 ? `+${coef.toFixed(2)}` : coef.toFixed(2)}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">Loading correlation grids...</div>
          )}
        </div>

      </div>

    </div>
  );
}
