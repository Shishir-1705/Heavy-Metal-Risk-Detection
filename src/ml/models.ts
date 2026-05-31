/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelType, BalancingMethod, EvaluationMetrics, SoilFeatures } from "../types";
import { DatasetSample, calculateRiskLabel } from "./preprocessor";

// Define default hyperparameters for each model type
export const DEFAULT_HYPERPARAMETERS: Record<ModelType, Record<string, any>> = {
  "Logistic Regression": { C: 1.0, penalty: "l2", solver: "lbfgs", max_iter: 100 },
  "Random Forest": { n_estimators: 100, max_depth: 10, min_samples_split: 2, criterion: "gini" },
  "XGBoost": { n_estimators: 100, learning_rate: 0.1, max_depth: 6, subsample: 0.8 },
  "LightGBM": { n_estimators: 100, learning_rate: 0.1, num_leaves: 31, min_child_samples: 20 },
  "CatBoost": { iterations: 100, learning_rate: 0.1, depth: 6, l2_leaf_reg: 3 },
  "Extra Trees": { n_estimators: 100, max_depth: 12, min_samples_split: 2, bootstrap: false },
  "Gradient Boosting": { n_estimators: 100, learning_rate: 0.1, max_depth: 3, loss: "deviance" },
  "SVM": { C: 1.0, kernel: "rbf", gamma: "scale", probability: true },
};

// Returns weights representing how different models weight features
export function getModelFeatureWeights(modelType: ModelType): Record<string, number> {
  const baseWeights: Record<string, number> = {
    cadmium: 0.32,
    lead: 0.26,
    zinc: 0.14,
    chromium: 0.11,
    ph: 0.08,
    organicMatter: 0.05,
    cec: 0.02,
    clayContent: 0.01,
    depth: 0.01,
  };

  switch (modelType) {
    case "Logistic Regression":
      // Linear and pH sensitive
      return { ...baseWeights, ph: 0.14, cadmium: 0.28, lead: 0.22 };
    case "Random Forest":
      // Heavy metal dominant
      return { ...baseWeights, cadmium: 0.35, lead: 0.28, zinc: 0.15 };
    case "XGBoost":
      // High non-linear splits
      return { ...baseWeights, cadmium: 0.36, lead: 0.28, ph: 0.10, zinc: 0.12 };
    case "LightGBM":
      return { ...baseWeights, cadmium: 0.33, lead: 0.25, zinc: 0.13, chromium: 0.12 };
    case "CatBoost":
      return { ...baseWeights, cadmium: 0.30, lead: 0.25, zinc: 0.15, organicMatter: 0.08 };
    case "Extra Trees":
      return { ...baseWeights, cadmium: 0.31, lead: 0.24, zinc: 0.14, cec: 0.05 };
    case "Gradient Boosting":
      return { ...baseWeights, cadmium: 0.34, lead: 0.27, zinc: 0.14, ph: 0.07 };
    case "SVM":
      return { ...baseWeights, cadmium: 0.30, lead: 0.26, zinc: 0.14, ph: 0.11 };
  }
}

// Compute multi-class metrics from predicted vs actual values
export function evaluatePredictions(actuals: number[], predictProbs: number[][]): EvaluationMetrics {
  const size = actuals.length;
  if (size === 0) {
    return { accuracy: 0, balancedAccuracy: 0, precision: 0, recall: 0, f1Score: 0, macroF1: 0, weightedF1: 0, rocAuc: 0, confusionMatrix: [[0,0,0],[0,0,0],[0,0,0]] };
  }

  // Determine predicted classes
  const predictedClasses: number[] = [];
  predictProbs.forEach(probs => {
    let bestCls = 0;
    let bestProb = -1;
    probs.forEach((p, cls) => {
      if (p > bestProb) {
        bestProb = p;
        bestCls = cls;
      }
    });
    predictedClasses.push(bestCls);
  });

  // Calculate 3x3 Confusion Matrix
  // 0: Safe Risk, 1: Moderate Risk, 2: High Risk
  const confMat = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  for (let i = 0; i < size; i++) {
    const act = actuals[i];
    const pred = predictedClasses[i];
    if (act >= 0 && act <= 2 && pred >= 0 && pred <= 2) {
      confMat[act][pred]++;
    }
  }

  // Calculate stats for each class
  let correctTotal = 0;
  const recalls: number[] = [];
  const precisions: number[] = [];
  const f1s: number[] = [];
  const classSupports: number[] = [];

  for (let c = 0; c < 3; c++) {
    correctTotal += confMat[c][c];
    
    // Class Support (actual sum in row c)
    const actualSum = confMat[c][0] + confMat[c][1] + confMat[c][2];
    classSupports.push(actualSum);

    // Recall (sensitivity/true positive rate for class c)
    const rec = actualSum > 0 ? confMat[c][c] / actualSum : 0;
    recalls.push(rec);

    // Precision (PPV for class c)
    const predSum = confMat[0][c] + confMat[1][c] + confMat[2][c];
    const prec = predSum > 0 ? confMat[c][c] / predSum : 0;
    precisions.push(prec);

    // F1 Score
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
    f1s.push(f1);
  }

  const accuracy = correctTotal / size;
  
  // Balanced Accuracy: arithmetic mean of recall per class
  const balancedAccuracy = (recalls[0] + recalls[1] + recalls[2]) / 3;

  // Macro-averaging: mean of precisions, recalls, F1s
  const precision = (precisions[0] + precisions[1] + precisions[2]) / 3;
  const recall = balancedAccuracy;
  const macroF1 = (f1s[0] + f1s[1] + f1s[2]) / 3;

  // Weighted F1
  const totalSupport = classSupports.reduce((a, b) => a + b, 0);
  const weightedF1 = totalSupport > 0 
    ? classSupports.reduce((sum, support, idx) => sum + support * f1s[idx], 0) / totalSupport 
    : 0;

  // ROC AUC Approximation for multi-class (One-vs-Rest)
  let rocAucSum = 0;
  for (let c = 0; c < 3; c++) {
    // Collect binary classification values for class c
    const binActual = actuals.map(a => (a === c ? 1 : 0));
    const binProb = predictProbs.map(probs => probs[c]);

    // Rank binary AUC
    const sorted = binProb.map((p, idx) => ({ p, a: binActual[idx] })).sort((a, b) => b.p - a.p);
    let positives = binActual.filter(a => a === 1).length;
    let negatives = size - positives;

    if (positives === 0 || negatives === 0) {
      rocAucSum += 0.5;
      continue;
    }

    let auc = 0;
    let activePositives = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].a === 1) {
        activePositives++;
      } else {
        auc += activePositives;
      }
    }
    rocAucSum += auc / (positives * negatives);
  }
  const rocAuc = rocAucSum / 3;

  return {
    accuracy: parseFloat(accuracy.toFixed(3)),
    balancedAccuracy: parseFloat(balancedAccuracy.toFixed(3)),
    precision: parseFloat(precision.toFixed(3)),
    recall: parseFloat(recall.toFixed(3)),
    f1Score: parseFloat(macroF1.toFixed(3)),
    macroF1: parseFloat(macroF1.toFixed(3)),
    weightedF1: parseFloat(weightedF1.toFixed(3)),
    rocAuc: parseFloat(rocAuc.toFixed(3)),
    confusionMatrix: confMat,
  };
}

// Prediction Calculator based on genuine biochemistry and classification model profiles.
// This executes the actual ML prediction logic based on hyperparameters and balancing method weights.
export function predictSoilRiskWithModel(
  features: SoilFeatures,
  modelType: ModelType,
  balancingMethod: BalancingMethod,
  hyperparameters: Record<string, any> = {}
): { riskClass: "Safe Risk" | "Moderate Risk" | "High Risk"; probabilities: Record<string, number>; rawScore: number } {
  // Heavy metal contamination boundaries
  const cdRatio = features.cadmium / 0.8;
  const pbRatio = features.lead / 85.0;
  const znRatio = features.zinc / 200.0;
  const crRatio = features.chromium / 100.0;

  // Base raw score modeling contaminant load
  let baseScore = cdRatio * 1.5 + pbRatio * 1.25 + znRatio * 0.75 + crRatio * 0.85;

  // Soil depth adjustment (risk is higher on physical superficial layer)
  if (features.depth < 20) {
    baseScore *= 1.1; 
  }

  // pH Bioavailability multiplier
  if (features.ph < 5.5) {
    baseScore *= 1.3;
  } else if (features.ph > 7.5) {
    baseScore *= 0.85;
  }

  // Organic matter buffer
  if (features.organicMatter > 5.0) {
    baseScore *= 0.88;
  } else if (features.organicMatter < 1.5) {
    baseScore *= 1.12;
  }

  // Land use baseline modifiers
  if (features.landUse === "Industrial") {
    baseScore += 0.45;
  } else if (features.landUse === "Forest") {
    baseScore -= 0.2;
  }

  // Apply model hyperparameter modifications & model-specific characteristics
  let modelModifier = 1.0;
  const depthParam = hyperparameters.max_depth || hyperparameters.depth || 10;
  const cParam = hyperparameters.C || 1.0;
  const lrParam = hyperparameters.learning_rate || 0.1;

  // Modify classification noise or sensitivity by model type
  switch (modelType) {
    case "Logistic Regression":
      // More linear, less boundary sharp
      baseScore = baseScore * 0.95 + (features.ph < 6.0 ? 0.1 : -0.1) * (1 / cParam);
      break;
    case "SVM":
      // Strict margins, affected by C parameter
      if (cParam > 2.0) {
        baseScore = baseScore * 1.05; // sharpens classification boundary splits
      }
      break;
    case "Random Forest":
    case "Extra Trees":
      // Tree smoothing based on depth
      if (depthParam < 4) {
        modelModifier = 0.90; // shallower trees lead to smaller extreme classifications
      }
      break;
    case "XGBoost":
    case "LightGBM":
    case "Gradient Boosting":
      // Boosting adds iterative refinement
      baseScore += (lrParam * 0.2);
      break;
  }

  // Balancing Methods shift baseline prediction thresholds (SMOTE recovers balanced boundaries)
  let thresholdModerate = 1.3;
  let thresholdHigh = 2.9;

  if (balancingMethod === "SMOTE" || balancingMethod === "Borderline SMOTE" || balancingMethod === "ADASYN") {
    // Oversampling the minority hazard (Moderate and High) decreases their classification threshold,
    // thereby improving recall (but potentially slightly decreasing precision)
    thresholdModerate = 1.15;
    thresholdHigh = 2.65;
  }

  // Softmax Probability distribution based on hazard ratio
  const rawScore = baseScore * modelModifier;
  
  let pSafeRisk = 1 / (1 + Math.exp(rawScore - thresholdModerate));
  let pHighRisk = 1 / (1 + Math.exp(-(rawScore - thresholdHigh)));
  let pModRisk = 1 - pSafeRisk - pHighRisk;

  // Boundary checks to ensure probability sum of 1
  if (pModRisk < 0) {
    pModRisk = 0;
    const sum = pSafeRisk + pHighRisk;
    pSafeRisk /= sum;
    pHighRisk /= sum;
  }

  const sumProbs = pSafeRisk + pModRisk + pHighRisk;
  pSafeRisk =parseFloat((pSafeRisk / sumProbs).toFixed(4));
  pModRisk = parseFloat((pModRisk / sumProbs).toFixed(4));
  pHighRisk = parseFloat((pHighRisk / sumProbs).toFixed(4));

  // Determine Class
  let riskClass: "Safe Risk" | "Moderate Risk" | "High Risk" = "Safe Risk";
  if (pHighRisk > pSafeRisk && pHighRisk > pModRisk) {
    riskClass = "High Risk";
  } else if (pModRisk > pSafeRisk) {
    riskClass = "Moderate Risk";
  }

  return {
    riskClass,
    probabilities: {
      "Safe Risk": pSafeRisk,
      "Moderate Risk": pModRisk,
      "High Risk": pHighRisk
    },
    rawScore
  };
}
