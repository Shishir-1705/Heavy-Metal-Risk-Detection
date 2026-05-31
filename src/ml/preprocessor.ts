/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoilFeatures, RiskClass } from "../types";

// Class distributions to model an imbalanced real-world classification problem
export interface DatasetSample {
  features: SoilFeatures;
  label: RiskClass;
}

// Generate an authentic sample conforming to soil chemistry rules
export function calculateRiskLabel(features: SoilFeatures): RiskClass {
  // Contamination limit thresholds:
  // Cadmium (Cd): ~0.8 mg/kg, Lead (Pb): ~85 mg/kg, Zinc (Zn): ~200 mg/kg, Chromium: ~100 mg/kg
  const cdRatio = features.cadmium / 0.8;
  const pbRatio = features.lead / 85.0;
  const znRatio = features.zinc / 200.0;
  const crRatio = features.chromium / 100.0;

  // Bioavailability / bio-hazard hazard score
  let hazardScore = cdRatio * 1.6 + pbRatio * 1.3 + znRatio * 0.7 + crRatio * 0.9;

  // pH Bioavailability Adjustments (Acidic soils mobilize heavy metals, making them riskier)
  if (features.ph < 5.5) {
    hazardScore *= 1.35;
  } else if (features.ph > 7.5) {
    hazardScore *= 0.80;
  }

  // Organic matter binds heavy metals, buffering toxicity
  if (features.organicMatter > 5.0) {
    hazardScore *= 0.85;
  } else if (features.organicMatter < 1.5) {
    hazardScore *= 1.15;
  }

  // CEC (Cation Exchange Capacity): higher CEC binds heavy metals and buffers risk
  if (features.cec > 30) {
    hazardScore *= 0.90;
  } else if (features.cec < 10) {
    hazardScore *= 1.10;
  }

  // Land Use vulnerability factors
  if (features.landUse === "Industrial") {
    hazardScore += 0.5; // High ambient contamination potential
  } else if (features.landUse === "Agriculture") {
    hazardScore += 0.1; // Direct exposure vector to crops/animals
  } else if (features.landUse === "Forest") {
    hazardScore -= 0.25; // Natural baseline
  }

  // Map to distinct risk categories representing soil standards
  if (hazardScore < 1.4) {
    return "Safe Risk";
  } else if (hazardScore < 3.2) {
    return "Moderate Risk";
  } else {
    return "High Risk";
  }
}

// Helper to generate representative agricultural records
export function generateSyntheticDataset(size: number = 200): DatasetSample[] {
  const dataset: DatasetSample[] = [];
  
  for (let i = 0; i < size; i++) {
    // Soil Depth: 0 - 100 cm
    const depth = Math.round(5 + Math.random() * 90);
    
    // Land Use distributed unevenly (Agriculture dominant, Industrial sparse)
    const randLand = Math.random();
    const landUse: SoilFeatures["landUse"] = 
      randLand < 0.50 ? "Agriculture" :
      randLand < 0.75 ? "Forest" :
      randLand < 0.90 ? "Residential" : "Industrial";
      
    // Soil pH: 4.5 to 8.5
    const ph = parseFloat((4.5 + Math.random() * 4.0).toFixed(2));
    
    // Organic Matter: 0.5% to 10%
    const organicMatter = parseFloat((0.5 + Math.random() * 8.5).toFixed(2));
    
    // Clay Content: 10% to 55%
    const clayContent = parseFloat((10.0 + Math.random() * 45.0).toFixed(2));
    
    // Cation Exchange Capacity (CEC): 5.0 to 45.0
    const cec = parseFloat((5.0 + Math.random() * 38.0).toFixed(2));

    // Heavy Metal concentration base distributions (differing by landUse)
    let leadBase = 10 + Math.random() * 40;
    let cadBase = 0.1 + Math.random() * 0.4;
    let zincBase = 30 + Math.random() * 100;
    let chromBase = 15 + Math.random() * 50;

    if (landUse === "Industrial") {
      leadBase *= (2 + Math.random() * 7);
      cadBase *= (2 + Math.random() * 10);
      zincBase *= (2 + Math.random() * 6);
      chromBase *= (1.5 + Math.random() * 4);
    } else if (landUse === "Agriculture") {
      // Moderate accumulation from fertilizers
      leadBase *= (1.0 + Math.random() * 1.5);
      cadBase *= (1.0 + Math.random() * 2.5);
      zincBase *= (1.1 + Math.random() * 1.8);
    } else if (landUse === "Residential") {
      leadBase *= (1.2 + Math.random() * 1.5);
    }

    const lead = parseFloat(leadBase.toFixed(2));
    const cadmium = parseFloat(cadBase.toFixed(2));
    const zinc = parseFloat(zincBase.toFixed(2));
    const chromium = parseFloat(chromBase.toFixed(2));

    const features: SoilFeatures = {
      depth,
      landUse,
      ph,
      organicMatter,
      clayContent,
      cec,
      lead,
      cadmium,
      zinc,
      chromium,
    };

    const label = calculateRiskLabel(features);
    dataset.push({ features, label });
  }

  return dataset;
}

// Numerical Preprocessing, Imputation, Winsorization (Outlier Mitigation), scaling
export interface PreprocessedData {
  headers: string[];
  features: number[][]; // N x F matrix
  labels: number[]; // N array (0: Safe, 1: Moderate, 2: High)
  scalers: {
    means: number[];
    stds: number[];
  };
}

export function preprocessDataset(samples: DatasetSample[]): PreprocessedData {
  const numericKeys: (keyof SoilFeatures)[] = [
    "depth", "ph", "organicMatter", "clayContent", "cec", "lead", "cadmium", "zinc", "chromium"
  ];
  
  const headers = [
    ...numericKeys,
    "landUse_Agriculture",
    "landUse_Industrial",
    "landUse_Forest",
    "landUse_Residential",
  ];

  // 1. Data Cleaning & Outlier Mitigation (Winsorization at 1st and 99th percentiles)
  const numericVals: Record<string, number[]> = {};
  numericKeys.forEach(k => {
    numericVals[k] = samples.map(s => s.features[k] as number).filter(v => v !== null && !isNaN(v));
    numericVals[k].sort((a, b) => a - b);
  });

  const percentiles: Record<string, { p1: number; p99: number }> = {};
  numericKeys.forEach(k => {
    const list = numericVals[k];
    const len = list.length;
    percentiles[k] = {
      p1: list[Math.floor(len * 0.01)] || list[0],
      p99: list[Math.floor(len * 0.99)] || list[len - 1],
    };
  });

  const matrix: number[][] = [];
  const labels: number[] = [];

  samples.forEach(s => {
    const rowFeatures: number[] = [];
    
    // Apply Winsorization to continuous variables
    numericKeys.forEach((key, colIndex) => {
      let val = s.features[key] as number;
      // Missing value imputation using feature mean
      if (val === undefined || val === null || isNaN(val)) {
        const sum = numericVals[key].reduce((a, b) => a + b, 0);
        val = sum / numericVals[key].length;
      }
      // Outlier capping
      const bounds = percentiles[key];
      if (val < bounds.p1) val = bounds.p1;
      if (val > bounds.p99) val = bounds.p99;
      
      rowFeatures.push(val);
    });

    // 2. One-hot encode Land Use
    const land = s.features.landUse;
    rowFeatures.push(land === "Agriculture" ? 1 : 0);
    rowFeatures.push(land === "Industrial" ? 1 : 0);
    rowFeatures.push(land === "Forest" ? 1 : 0);
    rowFeatures.push(land === "Residential" ? 1 : 0);

    matrix.push(rowFeatures);

    // Label Encoding
    const labelVal = s.label === "Safe Risk" ? 0 : s.label === "Moderate Risk" ? 1 : 2;
    labels.push(labelVal);
  });

  // 3. Feature Scaling: Z-score standardization (only numeric features, indexes 0 to 8)
  const means: number[] = [];
  const stds: number[] = [];
  const numFeaturesCount = numericKeys.length;

  for (let c = 0; c < numFeaturesCount; c++) {
    const colVals = matrix.map(row => row[c]);
    const mean = colVals.reduce((a, b) => a + b, 0) / colVals.length;
    const sqDiffSum = colVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    const std = Math.sqrt(sqDiffSum / colVals.length) || 1.0;
    means.push(mean);
    stds.push(std);
  }

  // Pad scalers for one-hot encoded variables (identity scale)
  for (let c = numFeaturesCount; c < headers.length; c++) {
    means.push(0);
    stds.push(1);
  }

  const finalFeatures = matrix.map(row => {
    return row.map((val, c) => {
      return (val - means[c]) / stds[c];
    });
  });

  return {
    headers,
    features: finalFeatures,
    labels,
    scalers: { means, stds },
  };
}

// Compute Pearson correlation of features for selection and analytics
export function computeCorrelationMatrix(data: DatasetSample[]): { headers: string[]; matrix: number[][] } {
  const keys: (keyof SoilFeatures)[] = [
    "depth", "ph", "organicMatter", "clayContent", "cec", "lead", "cadmium", "zinc", "chromium"
  ];
  
  const headers = keys.map(String);
  const matrix: number[][] = [];

  for (let i = 0; i < keys.length; i++) {
    const row: number[] = [];
    const valI = data.map(d => d.features[keys[i]] as number);
    const meanI = valI.reduce((a, b) => a + b, 0) / valI.length;

    for (let j = 0; j < keys.length; j++) {
      const valJ = data.map(d => d.features[keys[j]] as number);
      const meanJ = valJ.reduce((a, b) => a + b, 0) / valJ.length;

      let num = 0;
      let denI = 0;
      let denJ = 0;

      for (let k = 0; k < data.length; k++) {
        const diffI = valI[k] - meanI;
        const diffJ = valJ[k] - meanJ;
        num += diffI * diffJ;
        denI += diffI * diffI;
        denJ += diffJ * diffJ;
      }

      const r = denI && denJ ? num / Math.sqrt(denI * denJ) : 0;
      row.push(parseFloat(r.toFixed(3)));
    }
    matrix.push(row);
  }

  return { headers, matrix };
}
