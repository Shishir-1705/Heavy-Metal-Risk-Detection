/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Plus, 
  Brain, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Sliders, 
  BookOpen,
  Sparkles,
  Clipboard,
  Leaf
} from "lucide-react";

interface PredictorViewProps {
  onPredict: (features: any) => Promise<any>;
  onGetGeminiExplain: (features: any, prediction: any) => Promise<any>;
  user: any;
}

// Soil presets for expert quick-assessment
const SYSTEM_PRESETS = [
  {
    name: "Acidic Vineyard (High Cadmium)",
    desc: "Low pH mobilizes active Cadmium concentrations from synthetic fertilizers.",
    features: { depth: 15, landUse: "Agriculture", ph: 4.8, organicMatter: 1.5, clayContent: 12, cec: 8, lead: 42.0, cadmium: 2.8, zinc: 110.0, chromium: 45.0 }
  },
  {
    name: "Alkaline Arable (Safe Baseline)",
    desc: "Heavy Organic matter binds typical contaminants safely.",
    features: { depth: 30, landUse: "Agriculture", ph: 7.6, organicMatter: 5.5, clayContent: 35, cec: 28, lead: 12.0, cadmium: 0.15, zinc: 45.0, chromium: 20.0 }
  },
  {
    name: "Suburban Residential (Moderate Lead)",
    desc: "Legacy paint/waste residue displays moderate superficial accumulation.",
    features: { depth: 25, landUse: "Residential", ph: 6.2, organicMatter: 3.2, clayContent: 22, cec: 14, lead: 98.0, cadmium: 0.5, zinc: 165.0, chromium: 35.0 }
  },
  {
    name: "Industrial Inflow (Critical Hazard)",
    desc: "Severe toxic loading from manufacturing wastewater spills.",
    features: { depth: 40, landUse: "Industrial", ph: 5.1, organicMatter: 1.1, clayContent: 45, cec: 18, lead: 320.0, cadmium: 8.5, zinc: 650.0, chromium: 180.0 }
  }
];

export default function PredictorView({ onPredict, onGetGeminiExplain, user }: PredictorViewProps) {
  // Input features state
  const [depth, setDepth] = useState<number>(30);
  const [landUse, setLandUse] = useState<string>("Agriculture");
  const [ph, setPh] = useState<number>(6.5);
  const [organicMatter, setOrganicMatter] = useState<number>(3.5);
  const [clayContent, setClayContent] = useState<number>(25.0);
  const [cec, setCec] = useState<number>(18.0);
  const [lead, setLead] = useState<number>(15.0);
  const [cadmium, setCadmium] = useState<number>(0.2);
  const [zinc, setZinc] = useState<number>(60.0);
  const [chromium, setChromium] = useState<number>(35.0);

  // Status logs
  const [isClassifying, setIsClassifying] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [predictionOutcome, setPredictionOutcome] = useState<any | null>(null);
  const [explainOutcome, setExplainOutcome] = useState<any | null>(null);
  const [errorText, setErrorText] = useState("");

  const applyPreset = (preset: typeof SYSTEM_PRESETS[0]) => {
    setDepth(preset.features.depth);
    setLandUse(preset.features.landUse);
    setPh(preset.features.ph);
    setOrganicMatter(preset.features.organicMatter);
    setClayContent(preset.features.clayContent);
    setCec(preset.features.cec);
    setLead(preset.features.lead);
    setCadmium(preset.features.cadmium);
    setZinc(preset.features.zinc);
    setChromium(preset.features.chromium);
    setPredictionOutcome(null);
    setExplainOutcome(null);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsClassifying(true);
    setIsExplaining(false);
    setErrorText("");
    setPredictionOutcome(null);
    setExplainOutcome(null);

    const payload = {
      depth,
      landUse,
      ph,
      organicMatter,
      clayContent,
      cec,
      lead,
      cadmium,
      zinc,
      chromium
    };

    try {
      // 1. Run predicted classification algorithms on server
      const predRes = await onPredict(payload);
      if (!predRes.success) throw new Error(predRes.error || "Model prediction failed.");
      
      setPredictionOutcome(predRes);
      
      // 2. Run Gemini EAI explainability sequence
      setIsExplaining(true);
      const explainRes = await onGetGeminiExplain(payload, predRes.prediction);
      setExplainOutcome(explainRes.explanation);
    } catch (err: any) {
      setErrorText(err.message || "A network transport failure isolated the classifier server.");
    } finally {
      setIsClassifying(false);
      setIsExplaining(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
      
      {/* LEFT COLUMN: Input Sliders & Presets */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* presets panel */}
        <div id="presets-panel" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Clipboard className="w-4 h-4 text-emerald-500" />
            <span>EXPERT PRESETS</span>
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {SYSTEM_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all cursor-pointer text-xs"
              >
                <div className="font-bold text-slate-800 dark:text-slate-150">{p.name}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-550 truncate mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Input Form */}
        <form onSubmit={handlePredict} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-500" />
            <span>SOIL CORE ATTRIBUTES</span>
          </h3>

          <div className="space-y-4">
            
            {/* Categoric variables */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">
                Land Use History
              </label>
              <select
                value={landUse}
                onChange={(e) => setLandUse(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="Agriculture">Agricultural Crop Farm</option>
                <option value="Industrial">Industrial Manufacturing Zone</option>
                <option value="Forest">Natural Protected Forest Wood</option>
                <option value="Residential">Suburban Residential Garden</option>
              </select>
            </div>

            {/* pH continuous slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-400 uppercase text-[10px] tracking-widest">Soil pH level</span>
                <span className="font-mono text-emerald-650 dark:text-emerald-450">{ph.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="4.0"
                max="9.0"
                step="0.05"
                value={ph}
                onChange={(e) => setPh(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-100 dark:bg-slate-950 cursor-pointer"
              />
              <span className="text-[9px] text-slate-400 italic block mt-0.5">Note: values &lt;5.5 mobilize Lead and Cadmium hazard toxicity.</span>
            </div>

            {/* Depth continuous slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-400 uppercase text-[10px] tracking-widest">Soil Depth</span>
                <span className="font-mono text-emerald-650 dark:text-emerald-450">{depth} cm</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                step="1"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-100 dark:bg-slate-950 cursor-pointer"
              />
            </div>

            {/* Organic matter continuous slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-400 uppercase text-[10px] tracking-widest">Organic Matter (%)</span>
                <span className="font-mono text-emerald-650 dark:text-emerald-450">{organicMatter.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="12.0"
                step="0.1"
                value={organicMatter}
                onChange={(e) => setOrganicMatter(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-100 dark:bg-slate-950 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100 dark:border-slate-850">
              {/* Clay content continuous slider */}
              <div>
                <label className="block text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Clay Content (%)</label>
                <div className="font-mono text-xs font-bold text-emerald-650 dark:text-emerald-450">{clayContent}%</div>
                <input
                  type="range"
                  min="5"
                  max="55"
                  step="1"
                  value={clayContent}
                  onChange={(e) => setClayContent(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* CEC slider */}
              <div>
                <label className="block text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">CEC (meq/100g)</label>
                <div className="font-mono text-xs font-bold text-emerald-650 dark:text-emerald-450">{cec}</div>
                <input
                  type="range"
                  min="2.0"
                  max="45.0"
                  step="0.5"
                  value={cec}
                  onChange={(e) => setCec(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            {/* Heavy Metals limits adjustments */}
            <p className="text-[10px] font-bold text-slate-400">HEAVY METALS CONTENT (mg/kg)</p>
            
            {/* Cadmium continuous slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-0.5">
                <span className="text-slate-500 text-[10px]">Cadmium (Cd) - EPA: 0.8 mg/kg</span>
                <span className="font-mono text-red-500">{cadmium.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="12.0"
                step="0.05"
                value={cadmium}
                onChange={(e) => setCadmium(parseFloat(e.target.value))}
                className="w-full accent-red-500 bg-slate-100 dark:bg-slate-950 cursor-pointer"
              />
            </div>

            {/* Lead continuous slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-0.5">
                <span className="text-slate-500 text-[10px]">Lead (Pb) - EPA: 85 mg/kg</span>
                <span className="font-mono text-red-500">{lead.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="450.0"
                step="5.0"
                value={lead}
                onChange={(e) => setLead(parseFloat(e.target.value))}
                className="w-full accent-red-500 bg-slate-100 dark:bg-slate-950 cursor-pointer"
              />
            </div>

            {/* Zinc continuous slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-0.5">
                <span className="text-slate-500 text-[10px]">Zinc (Zn) - EPA: 200 mg/kg</span>
                <span className="font-mono text-amber-500">{zinc.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="850.0"
                step="10.0"
                value={zinc}
                onChange={(e) => setZinc(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-slate-100 dark:bg-slate-950 cursor-pointer"
              />
            </div>

            {/* Chromium continuous slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-0.5">
                <span className="text-slate-500 text-[10px]">Chromium (Cr) - EPA: 100 mg/kg</span>
                <span className="font-mono text-amber-500">{chromium.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="250.0"
                step="5.0"
                value={chromium}
                onChange={(e) => setChromium(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-slate-100 dark:bg-slate-950 cursor-pointer"
              />
            </div>

          </div>

          {/* Predict Trigger button */}
          <button
            type="submit"
            disabled={isClassifying}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-205 dark:disabled:bg-slate-800 disabled:text-slate-400 font-bold text-xs tracking-wider rounded-xl transition-all shadow-md text-white border border-emerald-500 cursor-pointer"
          >
            {isClassifying ? "PROCESSING SOIL THROUGH PIPELINE..." : "EXECUTE HAZARD PREDICTION"}
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: Results, Predictions, explainability */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* State 1: Before predictions */}
        {!predictionOutcome && !isClassifying && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-center">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl text-emerald-600 mb-4 animate-bounce">
              <Activity className="w-10 h-10" />
            </div>
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">
              Awaiting Soil Characteristics Input
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
              Select an expert preset above or configure physical continuous sliders, then click "EXECUTE HAZARD PREDICTION" to run Z-score preprocessors and active ML pipelines.
            </p>
          </div>
        )}

        {/* State 2: When prediction runs */}
        {isClassifying && (
          <div className="min-h-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin"></div>
              <Brain className="absolute inset-4 w-8 h-8 text-emerald-500 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-350 text-sm">ML Pipeline Preprocessing Active...</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                Imputing null values, normalizing coordinates, one-hot encoding land categorical markers, and running probability estimators.
              </p>
            </div>
            {isExplaining && (
              <span className="text-[10px] text-indigo-500 font-bold animate-pulse font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Connective EAI: Gemini is compiling biological interpretations...
              </span>
            )}
          </div>
        )}

        {/* State 3: Successful Predict outcomes */}
        {predictionOutcome && !isClassifying && (
          <div className="space-y-6">
            
            {/* Visual prediction outcome */}
            <div className={`border rounded-3xl p-6 shadow-sm ${
              predictionOutcome.prediction.riskClass === "High Risk"
                ? "bg-red-50/50 dark:bg-red-950/20 border-red-200"
                : predictionOutcome.prediction.riskClass === "Moderate Risk"
                ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200"
                : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-250"
            }`}>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/50 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    PIPELINE OUTCOME • CONFIDENCE: {predictionOutcome.prediction.confidence}
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-8">
                    {predictionOutcome.prediction.riskClass}
                  </h2>
                </div>
                
                {/* Large visual icon */}
                <div className={`p-3 rounded-2xl ${
                  predictionOutcome.prediction.riskClass === "High Risk"
                    ? "bg-red-100 text-red-650"
                    : predictionOutcome.prediction.riskClass === "Moderate Risk"
                    ? "text-amber-650 bg-amber-100"
                    : "bg-emerald-100 text-emerald-650"
                }`}>
                  {predictionOutcome.prediction.riskClass === "High Risk" ? <ShieldAlert className="w-8 h-8 animate-bounce" /> : <CheckCircle2 className="w-8 h-8" />}
                </div>
              </div>

              {/* Probabilities progress visualization */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Model Probabilities</p>
                <div className="space-y-2">
                  {Object.entries(predictionOutcome.prediction.probabilities).map(([key, value]: any) => {
                    const isTarget = key === predictionOutcome.prediction.riskClass;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className={isTarget ? "text-slate-900 dark:text-slate-100 font-extrabold" : "text-slate-500"}>
                            {key}
                          </span>
                          <span className="font-mono">{(value * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-150 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200/30">
                          <div 
                            style={{ width: `${value * 100}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              key === "High Risk" 
                                ? "bg-red-500" 
                                : key === "Moderate Risk" 
                                ? "bg-amber-500" 
                                : "bg-emerald-500"
                            }`}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Explainable AI section driven by Gemini */}
            <div id="explainable-ai-pane" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-550 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>Explainable AI (EAI) - Interpretations & Remediation</span>
              </h3>

              {!explainOutcome && isExplaining && (
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-2 text-xs">
                  <div className="w-8 h-8 border-4 border-slate-150 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span className="text-slate-400 font-mono animate-pulse">Gemini is compiling bio-agronomic insights...</span>
                </div>
              )}

              {explainOutcome && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  
                  {/* Summary commentary paragraph text */}
                  <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                    <p className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Agronomic Commentary
                    </p>
                    {explainOutcome.summaryText}
                  </div>

                  {/* Recommendation check lists */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Actionable Remediation & Mitigation Protocols</span>
                    </p>
                    <ul className="space-y-2">
                      {explainOutcome.actionableAdvice.map((adv: string, aIdx: number) => (
                        <li key={aIdx} className="flex gap-2.5 items-start text-xs text-slate-650 dark:text-slate-350 select-none">
                          <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-650 font-bold text-[10px] shrink-0 mt-0.5 flex items-center justify-center">
                            {aIdx + 1}
                          </span>
                          <span className="leading-5">{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
