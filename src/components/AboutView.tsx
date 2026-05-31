/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  BookOpen, 
  Table, 
  FileText, 
  Sprout, 
  ShieldCheck, 
  Bookmark,
  Share2
} from "lucide-react";

export default function AboutView() {
  
  const referenceLimits = [
    { element: "Cadmium (Cd)", epa: "0.85 mg/kg", eu: "1.0 mg/kg", effect: "Extremely toxic. Causes severe cellular necrosis in roots and enters high accumulation paths in crops." },
    { element: "Lead (Pb)", epa: "85.0 mg/kg", eu: "100.0 mg/kg", effect: "Displaces crucial nutrients like Iron/Calcium, stunts germination weights, and damages vegetation systems." },
    { element: "Zinc (Zn)", epa: "200.0 mg/kg", eu: "150.0 mg/kg", effect: "Essential micronutrient, but toxic at high levels. Restricts chlorophyll synthesis, causing severe leaf chlorosis." },
    { element: "Chromium (Cr)", epa: "100.0 mg/kg", eu: "100.0 mg/kg", effect: "Restricts photosynthesis rates and enzyme actions, degrading plant structural yields." }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-350">
      
      {/* Overview Block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-md font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          <span>Scientific Project Background & Objective</span>
        </h3>
        
        <div className="text-xs text-slate-650 dark:text-slate-400 space-y-3.5 leading-relaxed">
          <p>
            Soil contamination by toxic heavy metals is a critical issue in modern agricultural systems. Anthropogenic activities—such as sewage irrigation, chemical fertilizer over-application, and industrial emissions—accelerate the build-up of Cadmium (Cd), Lead (Pb), Zinc (Zn), and Chromium (Cr) in soils.
          </p>
          <p>
            This application deploys machine learning models with advanced oversampling and Explainable AI (EAI) to serve as a fast soil toxicity screening platform. By modeling physical characteristics (Depth, pH, Organic Matter, Cation Exchange Capacity) alongside metal contaminants, it predicts whether agricultural soil fits into:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            
            <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 space-y-1">
              <span className="font-extrabold text-emerald-600 block text-xs">Safe Risk</span>
              <p className="text-[11px] text-slate-405 leading-4">Contaminants are within acceptable safety parameters. Natural soil buffer systems comfortably handle trace elements.</p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-500/10 space-y-1">
              <span className="font-extrabold text-indigo-500 block text-xs">Moderate Risk</span>
              <p className="text-[11px] text-slate-405 leading-4">Contaminants near dangerous safety limits. Mitigation protocols should be deployed to prevent bioaccumulation in crops.</p>
            </div>

            <div className="p-4 rounded-xl bg-indigo-650/5 dark:bg-indigo-950/20 border border-indigo-700/20 space-y-1">
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block text-xs">High Risk</span>
              <p className="text-[11px] text-slate-405 leading-4">Toxicity levels violate regulatory guidelines. High risk of crop contamination and human food chain entry. Remediation is required.</p>
            </div>

          </div>
        </div>
      </div>

      {/* Heavy Metal Limits Standard Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-md font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
          <Table className="w-5 h-5 text-emerald-500" />
          <span>Heavy Metal Environmental Safety Standards</span>
        </h3>
        <p className="text-[11px] text-slate-400">EPA vs European Council environmental protection standards for uncontaminated agricultural substrates.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 font-bold uppercase text-[9px] text-slate-500 border-b border-slate-150 dark:border-slate-850">
                <th className="px-4 py-2.5">Trace Metalloid</th>
                <th className="px-4 py-2.5">EPA Threshold</th>
                <th className="px-4 py-2.5">EU Threshold</th>
                <th className="px-4 py-2.5">Botanical Phytotoxicity & Symptoms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs text-slate-650 dark:text-slate-350">
              {referenceLimits.map((l, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40">
                  <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-150">{l.element}</td>
                  <td className="px-4 py-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{l.epa}</td>
                  <td className="px-4 py-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{l.eu}</td>
                  <td className="px-4 py-3.5 leading-relaxed">{l.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remediation & Agronomic Best Practices */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-md font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
          <Sprout className="w-5 h-5 text-emerald-500" />
          <span>Contaminated Soil Reclamation Protocols</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> pH Management (Liming)
            </span>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Metals have high solubility in acidic settings (pH &lt; 5.5). Applying agricultural lime or calcium carbonate raises pH above 6.5. This precipitates soluble metals into insoluble minerals, locking them safely within the soil substrate and preventing root absorption.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Organic Amendments
            </span>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Incorporating biochar, humic/fulvic acids, and animal compost adds active organic matter. Humic molecules feature plentiful carboxyl and phenolic structures that bind heavy metal ions, creating stable chelates that isolate contaminants from plant roots.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Phytoremediation Crops
            </span>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              For moderate-to-high risk zones, crop cycles should transition to metal-hyperaccumulating species like Indian Mustard (<i>Brassica juncea</i>), sunflowers, or poplars. These plants naturally absorb contaminants, storing them in their harvestable tissues before safe disposal.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Electrokinetic Remediation
            </span>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Deploying low-voltage direct current through vertical electrodes inserted into wet soil induces ionic migration. Heavy metals migrate towards the cathode where they can be collected, safely clearing high-density industrial contamination hotspots.
            </p>
          </div>

        </div>
      </div>

      {/* Dataset & Code References */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-md font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-3">
          <Bookmark className="w-5 h-5 text-emerald-500" />
          <span>Dataset & Research References</span>
        </h3>
        
        <div className="text-xs text-slate-400 space-y-2">
          <p className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Kaggle Soil Analysis Dataset: <a href="https://www.kaggle.com/datasets/saurabhshahane/soil-analysis" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline">saurabhshahane/soil-analysis</a></span>
          </p>
          <p className="flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Soil chemistry & safety limit guidelines match Environmental Protection Agency (EPA) standards.</span>
          </p>
        </div>
      </div>

    </div>
  );
}
