/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper: Calculate Euclidean distance between two vectors
function euclideanDistance(v1: number[], v2: number[]): number {
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    sum += Math.pow(v1[i] - v2[i], 2);
  }
  return Math.sqrt(sum);
}

// Helper: Find k-nearest neighbors of a sample in a list of points
interface Neighbor {
  index: number;
  distance: number;
}

function getKNearestNeighbors(sample: number[], points: number[][], k: number): Neighbor[] {
  const neighbors: Neighbor[] = [];
  
  for (let i = 0; i < points.length; i++) {
    const dist = euclideanDistance(sample, points[i]);
    neighbors.push({ index: i, distance: dist });
  }

  // Sort by distance (ascending)
  neighbors.sort((a, b) => a.distance - b.distance);
  
  // Return nearest k neighbors (excluding the sample itself if distance is 0,
  // but to be safe we capture 1 to k+1 if we compare within the same set, or just 0 to k if we compare with external sets)
  return neighbors.slice(0, k);
}

/**
 * SMOTE: Synthetic Minority Over-sampling Technique
 */
export function applySMOTE(
  features: number[][],
  labels: number[],
  kNeighbors: number = 5
): { features: number[][]; labels: number[] } {
  const balancedFeatures = [...features.map(f => [...f])];
  const balancedLabels = [...labels];

  // Find class distribution
  const classCounts: Record<number, number> = {};
  labels.forEach(l => {
    classCounts[l] = (classCounts[l] || 0) + 1;
  });

  const majorityCount = Math.max(...Object.values(classCounts));
  const classes = Object.keys(classCounts).map(Number);

  classes.forEach(cls => {
    const clsCount = classCounts[cls];
    if (clsCount === majorityCount) return; // Skip majority class

    const numToSynthesize = majorityCount - clsCount;
    const clsIndices = labels.map((l, idx) => (l === cls ? idx : -1)).filter(idx => idx !== -1);
    const clsFeatures = clsIndices.map(idx => features[idx]);

    if (clsFeatures.length < 2) return; // Need at least 2 points to interpolate

    const actualK = Math.min(kNeighbors, clsFeatures.length - 1);

    for (let i = 0; i < numToSynthesize; i++) {
      // Pick random minority sample
      const randIdx = Math.floor(Math.random() * clsFeatures.length);
      const originalSample = clsFeatures[randIdx];

      // Get neighbors within the minority class
      const allOtherMinorityPoints = clsFeatures.filter((_, idx) => idx !== randIdx);
      const neighbors = getKNearestNeighbors(originalSample, allOtherMinorityPoints, actualK);

      if (neighbors.length === 0) continue;

      // Pick a random neighbor
      const randNeighborIdx = Math.floor(Math.random() * neighbors.length);
      const neighborSample = allOtherMinorityPoints[neighbors[randNeighborIdx].index];

      // Interpolate
      const syntheticSample: number[] = [];
      const gap = Math.random();
      for (let f = 0; f < originalSample.length; f++) {
        syntheticSample.push(originalSample[f] + gap * (neighborSample[f] - originalSample[f]));
      }

      balancedFeatures.push(syntheticSample);
      balancedLabels.push(cls);
    }
  });

  return { features: balancedFeatures, labels: balancedLabels };
}

/**
 * Borderline SMOTE (Borderline-1): Only oversamples minority samples close to the decision boundary
 */
export function applyBorderlineSMOTE(
  features: number[][],
  labels: number[],
  kNeighbors: number = 5
): { features: number[][]; labels: number[] } {
  const balancedFeatures = [...features.map(f => [...f])];
  const balancedLabels = [...labels];

  const classCounts: Record<number, number> = {};
  labels.forEach(l => {
    classCounts[l] = (classCounts[l] || 0) + 1;
  });

  const majorityCount = Math.max(...Object.values(classCounts));
  const classes = Object.keys(classCounts).map(Number);

  classes.forEach(cls => {
    const clsCount = classCounts[cls];
    if (clsCount === majorityCount) return;

    const numToSynthesize = majorityCount - clsCount;
    const clsIndices = labels.map((l, idx) => (l === cls ? idx : -1)).filter(idx => idx !== -1);
    const clsFeatures = clsIndices.map(idx => features[idx]);

    if (clsFeatures.length < 2) return;

    // Detect "danger" boundary points
    const dangerPoints: number[][] = [];
    const actualK = Math.min(kNeighbors, features.length - 1);

    clsFeatures.forEach(sample => {
      // Find neighbors among the ENTIRE dataset (excluding self)
      const allOtherPoints = features.filter(f => f !== sample);
      // Create equivalent labels mapping
      const allOtherLabels = labels.filter((_, idx) => features[idx] !== sample);

      const neighbors = getKNearestNeighbors(sample, allOtherPoints, actualK);
      
      // Count how many neighbors belong to majority classes
      let majorityNeighborCount = 0;
      neighbors.forEach(n => {
        if (allOtherLabels[n.index] !== cls) {
          majorityNeighborCount++;
        }
      });

      // Borderline condition: more than half, but not all neighbors are majority class
      // (If all are majority class, it might be noise; if few are, it's safe)
      if (majorityNeighborCount >= actualK / 2 && majorityNeighborCount < actualK) {
        dangerPoints.push(sample);
      }
    });

    // If no boundary danger points found, fallback to standard minority points
    const sourcePoints = dangerPoints.length > 0 ? dangerPoints : clsFeatures;
    const neighborK = Math.min(kNeighbors, clsFeatures.length - 1);

    for (let i = 0; i < numToSynthesize; i++) {
      const randIdx = Math.floor(Math.random() * sourcePoints.length);
      const originalSample = sourcePoints[randIdx];

      // Find nearest neighbors in the same minority class
      const allOtherMinorityPoints = clsFeatures.filter(f => f !== originalSample);
      const neighbors = getKNearestNeighbors(originalSample, allOtherMinorityPoints, neighborK);

      if (neighbors.length === 0) continue;

      const randNeighborIdx = Math.floor(Math.random() * neighbors.length);
      const neighborSample = allOtherMinorityPoints[neighbors[randNeighborIdx].index];

      const syntheticSample: number[] = [];
      const gap = Math.random();
      for (let f = 0; f < originalSample.length; f++) {
        syntheticSample.push(originalSample[f] + gap * (neighborSample[f] - originalSample[f]));
      }

      balancedFeatures.push(syntheticSample);
      balancedLabels.push(cls);
    }
  });

  return { features: balancedFeatures, labels: balancedLabels };
}

/**
 * ADASYN: Adaptive Synthetic Sampling Approach
 * Focuses oversampling on minority samples that are harder to learn (more majority neighbors)
 */
export function applyADASYN(
  features: number[][],
  labels: number[],
  kNeighbors: number = 5
): { features: number[][]; labels: number[] } {
  const balancedFeatures = [...features.map(f => [...f])];
  const balancedLabels = [...labels];

  const classCounts: Record<number, number> = {};
  labels.forEach(l => {
    classCounts[l] = (classCounts[l] || 0) + 1;
  });

  const majorityCount = Math.max(...Object.values(classCounts));
  const classes = Object.keys(classCounts).map(Number);

  classes.forEach(cls => {
    const clsCount = classCounts[cls];
    if (clsCount === majorityCount) return;

    const numToSynthesizeTotal = majorityCount - clsCount;
    const clsIndices = labels.map((l, idx) => (l === cls ? idx : -1)).filter(idx => idx !== -1);
    const clsFeatures = clsIndices.map(idx => features[idx]);

    if (clsFeatures.length < 2) return;

    // Calculate learning difficulty r_i for each minority sample
    // r_i = no. of majority class neighbors / k
    const r: number[] = [];
    let rSum = 0;
    const actualK = Math.min(kNeighbors, features.length - 1);

    clsFeatures.forEach(sample => {
      const allOtherPoints = features.filter(f => f !== sample);
      const allOtherLabels = labels.filter((_, idx) => features[idx] !== sample);

      const neighbors = getKNearestNeighbors(sample, allOtherPoints, actualK);
      let majorityNeighborCount = 0;
      neighbors.forEach(n => {
        if (allOtherLabels[n.index] !== cls) {
          majorityNeighborCount++;
        }
      });

      const ri = majorityNeighborCount / actualK;
      r.push(ri);
      rSum += ri;
    });

    // If all r_i are 0 (perfect separation), use uniform distribution
    const normalizedR = r.map(ri => (rSum > 0 ? ri / rSum : 1 / r.length));

    // Distribute total samples to synthesize across original minority samples
    const neighborK = Math.min(kNeighbors, clsFeatures.length - 1);

    normalizedR.forEach((ratio, sampleIdx) => {
      const numToGenForThisSample = Math.round(ratio * numToSynthesizeTotal);
      const originalSample = clsFeatures[sampleIdx];

      for (let i = 0; i < numToGenForThisSample; i++) {
        // Find nearest neighbors in same minority class
        const allOtherMinorityPoints = clsFeatures.filter(f => f !== originalSample);
        const neighbors = getKNearestNeighbors(originalSample, allOtherMinorityPoints, neighborK);

        if (neighbors.length === 0) continue;

        const randNeighborIdx = Math.floor(Math.random() * neighbors.length);
        const neighborSample = allOtherMinorityPoints[neighbors[randNeighborIdx].index];

        const syntheticSample: number[] = [];
        const gap = Math.random();
        for (let f = 0; f < originalSample.length; f++) {
          syntheticSample.push(originalSample[f] + gap * (neighborSample[f] - originalSample[f]));
        }

        balancedFeatures.push(syntheticSample);
        balancedLabels.push(cls);
      }
    });
  });

  return { features: balancedFeatures, labels: balancedLabels };
}

/**
 * Main Balancing Dispatcher
 */
export function balanceDataset(
  features: number[][],
  labels: number[],
  method: "None" | "SMOTE" | "Borderline SMOTE" | "ADASYN"
): { features: number[][]; labels: number[] } {
  switch (method) {
    case "SMOTE":
      return applySMOTE(features, labels);
    case "Borderline SMOTE":
      return applyBorderlineSMOTE(features, labels);
    case "ADASYN":
      return applyADASYN(features, labels);
    default:
      return { features, labels };
  }
}
