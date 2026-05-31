/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "./components/Sidebar";
import AuthModal from "./components/AuthModal";
import HomeView from "./components/HomeView";
import PredictorView from "./components/PredictorView";
import AnalyticsView from "./components/AnalyticsView";
import PerformanceView from "./components/PerformanceView";
import SHAPView from "./components/SHAPView";
import AboutView from "./components/AboutView";
import { PredictionHistoryRecord, UploadedDatasetRecord } from "./types";
import { Activity, AlertTriangle, ShieldCheck } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [authOpen, setAuthOpen] = useState<boolean>(false);

  // Core Data models State
  const [predictions, setPredictions] = useState<PredictionHistoryRecord[]>([]);
  const [uploadedDatasets, setUploadedDatasets] = useState<UploadedDatasetRecord[]>([]);
  const [activeConfig, setActiveConfig] = useState<any | null>(null);

  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sync darkness themes with Document DOM
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Load user profile on startup if JWT exists
  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem("soil_token");
      if (!token) return;

      try {
        const res = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem("soil_token");
        }
      } catch (err) {
        console.warn("OAuth Session verify exception", err);
      }
    };

    checkProfile();
  }, []);

  // Sync historical parameters on start & when user sessions transition
  const fetchHistoryAndConfig = async () => {
    const token = localStorage.getItem("soil_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      // 1. Fetch prediction logs
      const historyRes = await fetch("/api/history", { headers });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setPredictions(historyData.history || []);
      }

      // 2. Fetch active pipeline state config
      const infoRes = await fetch("/api/model-info");
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setActiveConfig(infoData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistoryAndConfig();
  }, [user]);

  const handleLoginSuccess = (token: string, userData: any) => {
    localStorage.setItem("soil_token", token);
    setUser(userData);
    triggerNotification("Access granted to SoilRisk Expert console.", "success");
    fetchHistoryAndConfig();
  };

  const handleLogout = () => {
    localStorage.removeItem("soil_token");
    setUser(null);
    setPredictions([]);
    triggerNotification("Logged out successfully.", "success");
  };

  const triggerNotification = (text: string, type: "success" | "error") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Prediction action dispatcher
  const handleModelPredict = async (features: any): Promise<any> => {
    const token = localStorage.getItem("soil_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/predict", {
      method: "POST",
      headers,
      body: JSON.stringify(features)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      triggerNotification("Soil hazard index mapped successfully.", "success");
      fetchHistoryAndConfig(); // reload lists
    }
    return data;
  };

  // Gemini explainability dispatcher
  const handleGeminiExplain = async (features: any, prediction: any): Promise<any> => {
    const res = await fetch("/api/gemini/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, prediction })
    });
    return await res.json();
  };

  // Dataset Upload retrain dispatcher
  const handleUploadDataset = async (filename: string, samples: any[]): Promise<any> => {
    const res = await fetch("/api/upload-dataset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, samples })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      triggerNotification("Upload recorded. Model recross-validated.", "success");
      setUploadedDatasets(prev => [data.datasetRecord, ...prev]);
      fetchHistoryAndConfig();
    } else {
      triggerNotification(data.error || "Retraining sequence failed.", "error");
    }
    return data;
  };

  // Model selection configurator
  const handleUpdateModelConfig = async (configPayload: any): Promise<any> => {
    const res = await fetch("/api/model-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configPayload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      triggerNotification(`${configPayload.modelType} successfully optimized and trained.`, "success");
      fetchHistoryAndConfig();
    } else {
      triggerNotification("Pipeline refit error.", "error");
    }
    return data;
  };

  const handleClearHistory = async () => {
    const token = localStorage.getItem("soil_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch("/api/history", { method: "DELETE", headers });
      if (res.ok) {
        setPredictions([]);
        triggerNotification("Scan logs purged.", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        onAuthClick={() => setAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 min-w-0 min-h-screen flex flex-col p-6 lg:p-8 space-y-6 overflow-y-auto">
        
        {/* Dynamic global Notification toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 max-w-sm ${
                notification.type === "success" 
                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-850 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" 
                  : "bg-red-50 dark:bg-red-950 text-red-850 dark:text-red-350 border-red-200"
              }`}
            >
              {notification.type === "success" ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
              <span>{notification.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab view selection wrapper */}
        <div className="flex-1">
          {activeTab === "home" && (
            <HomeView
              predictionCount={predictions.length}
              activeModelName={activeConfig?.modelType || "XGBoost"}
              accuracyRate={activeConfig?.metrics?.balancedAccuracy || 0.82}
              balancingMethod={activeConfig?.balancingMethod || "ADASYN"}
              predictionLogs={predictions}
              onClearHistory={handleClearHistory}
              onNavigateToPredict={() => setActiveTab("predict")}
              user={user}
            />
          )}

          {activeTab === "predict" && (
            <PredictorView
              onPredict={handleModelPredict}
              onGetGeminiExplain={handleGeminiExplain}
              user={user}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsView
              onUploadDataset={handleUploadDataset}
              uploadedDatasets={uploadedDatasets}
            />
          )}

          {activeTab === "performance" && (
            <PerformanceView
              onUpdateModelConfig={handleUpdateModelConfig}
              activeConfig={activeConfig}
            />
          )}

          {activeTab === "shap" && (
            <SHAPView
              activeConfig={activeConfig}
            />
          )}

          {activeTab === "about" && (
            <AboutView />
          )}
        </div>
      </main>

      {/* Auth Portal Dialog */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
