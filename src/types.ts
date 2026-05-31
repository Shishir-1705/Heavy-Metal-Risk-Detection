/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Soil Feature Definitions
export interface SoilFeatures {
  id?: string;
  depth: number; // in cm (0 to 100)
  landUse: "Agriculture" | "Industrial" | "Forest" | "Residential";
  ph: number; // pH value (3.0 to 10.0)
  organicMatter: number; // % organic matter (0.1% to 15.0%)
  clayContent: number; // % clay (5.0% to 60.0%)
  cec: number; // Cation Exchange Capacity (meq/100g) (2.0 to 50.0)
  lead: number; // Pb concentration (mg/kg) (2.0 to 500.0)
  cadmium: number; // Cd concentration (mg/kg) (0.05 to 15.0)
  zinc: number; // Zn concentration (mg/kg) (10.0 to 1000.0)
  chromium: number; // Cr concentration (mg/kg) (5.0 to 300.0)
}

// Risk Class Classification
export type RiskClass = "Safe Risk" | "Moderate Risk" | "High Risk";

// Prediction Result Structure
export interface PredictionResult {
  riskClass: RiskClass;
  probabilities: {
    "Safe Risk": number;
    "Moderate Risk": number;
    "High Risk": number;
  };
  confidence: "Low" | "Medium" | "High";
  rawPredictionValue: number;
  explanation: {
    contributions: { [K in keyof SoilFeatures]?: { value: number; direction: "positive" | "negative" } };
    summaryText: string;
    actionableAdvice: string[];
  };
}

// Dataset Balancing Methods
export type BalancingMethod = "None" | "SMOTE" | "Borderline SMOTE" | "ADASYN";

// Model Classifiers
export type ModelType =
  | "Logistic Regression"
  | "Random Forest"
  | "XGBoost"
  | "LightGBM"
  | "CatBoost"
  | "Extra Trees"
  | "Gradient Boosting"
  | "SVM";

// Optimizers
export type OptimizerType = "Randomized Search" | "Optuna Optimization";

// Model Evaluation Metrics
export interface EvaluationMetrics {
  accuracy: number;
  balancedAccuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  macroF1: number;
  weightedF1: number;
  rocAuc: number;
  confusionMatrix: number[][]; // 3x3 confusion matrix for Safe, Moderate, High
}

// Model Information
export interface ModelInfo {
  modelType: ModelType;
  balancingMethod: BalancingMethod;
  optimizerType: OptimizerType;
  hyperparameters: Record<string, any>;
  metrics: EvaluationMetrics;
  featureImportances: Record<string, number>;
  trainedAt: string;
  version: string;
}

// Database Schema Interfaces
export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface PredictionHistoryRecord {
  id: string;
  userId?: string;
  timestamp: string;
  features: SoilFeatures;
  prediction: {
    riskClass: RiskClass;
    confidence: string;
    probabilities: Record<RiskClass, number>;
  };
}

export interface UploadedDatasetRecord {
  id: string;
  filename: string;
  rowCount: number;
  uploadedAt: string;
  summary: {
    phMean: number;
    organicMatterMean: number;
    classDistribution: { "Safe Risk": number; "Moderate Risk": number; "High Risk": number };
  };
}

// Authentication Response
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  error?: string;
}
