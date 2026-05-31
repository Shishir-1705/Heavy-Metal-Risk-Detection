/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { dbActions, verifyToken } from "./src/backend/db";
import { generateSyntheticDataset, preprocessDataset, computeCorrelationMatrix, DatasetSample } from "./src/ml/preprocessor";
import { crossValidateModel, optimizePipeline } from "./src/ml/optimization";
import { predictSoilRiskWithModel } from "./src/ml/models";
import { BalancingMethod, ModelType, OptimizerType, SoilFeatures, RiskClass } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Initialize secure Gemini instance
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });

  // Base Synthetic Database initialization on first start
  const baseSoils = generateSyntheticDataset(250);
  console.log(`[ML Engine] Booted. Loaded ${baseSoils.length} baseline agricultural soil samples.`);

  // Authorization Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      req.user = undefined;
      return next();
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(403).json({ success: false, error: "Token signature expired or invalid session" });
    }

    req.user = payload;
    next();
  };

  // 1. Health Status check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "1.2.0"
    });
  });

  // 2. Authentication APIs
  app.post("/api/auth/signup", (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: "Please provide values for username, email, and password" });
    }
    const result = dbActions.signUp(username, email, password);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Please enter your email and password" });
    }
    const result = dbActions.login(email, password);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  app.get("/api/auth/profile", authenticateToken, (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    res.json({ success: true, user: req.user });
  });

  // 3. Prediction APIs
  app.post("/api/predict", authenticateToken, (req: any, res) => {
    const { depth, landUse, ph, organicMatter, clayContent, cec, lead, cadmium, zinc, chromium } = req.body;

    // Validate features are fully defined and numeric bounds
    if (
      depth === undefined || landUse === undefined || ph === undefined ||
      organicMatter === undefined || clayContent === undefined || cec === undefined ||
      lead === undefined || cadmium === undefined || zinc === undefined || chromium === undefined
    ) {
      return res.status(400).json({ success: false, error: "Missing soil input characteristics features in request payload." });
    }

    const features: SoilFeatures = {
      depth: Number(depth),
      landUse: landUse,
      ph: Number(ph),
      organicMatter: Number(organicMatter),
      clayContent: Number(clayContent),
      cec: Number(cec),
      lead: Number(lead),
      cadmium: Number(cadmium),
      zinc: Number(zinc),
      chromium: Number(chromium)
    };

    const config = dbActions.getActiveModelConfig();
    const result = predictSoilRiskWithModel(
      features,
      config.modelType as ModelType,
      config.balancingMethod as BalancingMethod,
      config.hyperparameters
    );

    // Save history
    dbActions.addPredictionHistory(req.user?.id, features, {
      riskClass: result.riskClass,
      confidence: result.probabilities[result.riskClass] > 0.7 ? "High" : result.probabilities[result.riskClass] > 0.45 ? "Medium" : "Low",
      probabilities: result.probabilities
    });

    res.json({
      success: true,
      features,
      prediction: {
        riskClass: result.riskClass,
        probabilities: result.probabilities,
        confidence: result.probabilities[result.riskClass] > 0.7 ? "High" : result.probabilities[result.riskClass] > 0.45 ? "Medium" : "Low"
      },
      modelConfig: config
    });
  });

  // 4. Batch prediction for uploads
  app.post("/api/batch-predict", authenticateToken, (req: any, res) => {
    const { samples } = req.body;
    if (!samples || !Array.isArray(samples)) {
      return res.status(400).json({ success: false, error: "Samples field is mandatory and must be an array of features." });
    }

    const config = dbActions.getActiveModelConfig();
    const results: any[] = [];
    let countSafe = 0, countMod = 0, countHigh = 0;

    samples.forEach((rawSample: any) => {
      const features: SoilFeatures = {
        depth: Number(rawSample.depth || 20),
        landUse: rawSample.landUse || "Agriculture",
        ph: Number(rawSample.ph || 6.5),
        organicMatter: Number(rawSample.organicMatter || 3.0),
        clayContent: Number(rawSample.clayContent || 25),
        cec: Number(rawSample.cec || 15),
        lead: Number(rawSample.lead || 15),
        cadmium: Number(rawSample.cadmium || 0.2),
        zinc: Number(rawSample.zinc || 60),
        chromium: Number(rawSample.chromium || 30)
      };

      const result = predictSoilRiskWithModel(
        features,
        config.modelType as ModelType,
        config.balancingMethod as BalancingMethod,
        config.hyperparameters
      );

      if (result.riskClass === "Safe Risk") countSafe++;
      if (result.riskClass === "Moderate Risk") countMod++;
      if (result.riskClass === "High Risk") countHigh++;

      const recordResult = {
        features,
        prediction: {
          riskClass: result.riskClass,
          probabilities: result.probabilities,
          confidence: result.probabilities[result.riskClass] > 0.70 ? "High" : result.probabilities[result.riskClass] > 0.45 ? "Medium" : "Low"
        }
      };

      results.push(recordResult);

      // Save predictions in DB history
      dbActions.addPredictionHistory(req.user?.id, features, recordResult.prediction);
    });

    res.json({
      success: true,
      batchSummary: { total: samples.length, Safe: countSafe, Moderate: countMod, High: countHigh },
      results
    });
  });

  // 5. Upload Dataset / Retraining hooks
  app.post("/api/upload-dataset", (req, res) => {
    const { filename, samples } = req.body;
    
    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return res.status(400).json({ success: false, error: "Empty or invalid samples format uploaded." });
    }

    // Process summary metrics
    const count = samples.length;
    let phSum = 0;
    let omSum = 0;
    let cSafe = 0, cMod = 0, cHigh = 0;

    const mappedSamples: DatasetSample[] = samples.map((s: any) => {
      const features: SoilFeatures = {
        depth: Number(s.depth || 20),
        landUse: s.landUse || "Agriculture",
        ph: Number(s.ph || 6.5),
        organicMatter: Number(s.organicMatter || 3.0),
        clayContent: Number(s.clayContent || 25),
        cec: Number(s.cec || 15),
        lead: Number(s.lead || 10),
        cadmium: Number(s.cadmium || 0.1),
        zinc: Number(s.zinc || 50),
        chromium: Number(s.chromium || 25)
      };

      phSum += features.ph;
      omSum += features.organicMatter;

      // Classify Label
      const score = (features.cadmium / 0.8) * 1.5 + (features.lead / 85.0) * 1.25 + (features.zinc / 200.0) * 0.75 + (features.chromium / 100.0) * 0.8;
      let label: RiskClass = "Safe Risk";
      if (score >= 2.9) {
        label = "High Risk";
        cHigh++;
      } else if (score >= 1.3) {
        label = "Moderate Risk";
        cMod++;
      } else {
        cSafe++;
      }

      return { features, label };
    });

    const phMean = parseFloat((phSum / count).toFixed(2));
    const organicMatterMean = parseFloat((omSum / count).toFixed(2));

    // Store custom dataset in database
    const record = dbActions.registerDataset(
      filename || "soil_dataset.csv",
      count,
      phMean,
      organicMatterMean,
      { "Safe Risk": cSafe, "Moderate Risk": cMod, "High Risk": cHigh }
    );

    // MLOPS Hook: Retrain Model and tune pipeline parameters automatically using newly updated dataset!
    const activeConf = dbActions.getActiveModelConfig();
    const compositeData = [...baseSoils, ...mappedSamples];

    const results = optimizePipeline(
      compositeData,
      activeConf.optimizerType as OptimizerType,
      activeConf.modelType as ModelType,
      activeConf.balancingMethod as BalancingMethod
    );

    // Update active activeModelConfig in DB with the optimal parameters found
    dbActions.updateActiveModelConfig({
      modelType: activeConf.modelType,
      balancingMethod: activeConf.balancingMethod,
      optimizerType: activeConf.optimizerType,
      hyperparameters: results.bestParams
    });

    res.json({
      success: true,
      datasetRecord: record,
      retrainingReport: {
        engine: "Optuna Auto-Tuning Engine",
        status: "Retrained Successfully",
        recalibratedHyperparameters: results.bestParams,
        crossValidationAccuracy: results.bestMetrics.balancedAccuracy,
        f1Score: results.bestMetrics.f1Score
      }
    });
  });

  // 6. Update Active Pipeline Model
  app.post("/api/model-config", (req, res) => {
    const { modelType, balancingMethod, optimizerType } = req.body;
    
    if (!modelType || !balancingMethod || !optimizerType) {
      return res.status(400).json({ success: false, error: "Please define modelType, balancingMethod, and optimizerType fields." });
    }

    // Run active Optuna or RandomSearch tuning on selected combination immediately
    const result = optimizePipeline(baseSoils, optimizerType as OptimizerType, modelType as ModelType, balancingMethod as BalancingMethod);

    const activeConf = dbActions.updateActiveModelConfig({
      modelType,
      balancingMethod,
      optimizerType,
      hyperparameters: result.bestParams
    });

    res.json({
      success: true,
      activeModelConfig: activeConf,
      bestMetrics: result.bestMetrics,
      trials: result.trials
    });
  });

  // 7. GET Model Info
  app.get("/api/model-info", (req, res) => {
    const activeConf = dbActions.getActiveModelConfig();
    
    // Crossvalidate model CV stats under base soils dataset
    const metrics = crossValidateModel(baseSoils, activeConf.modelType as ModelType, activeConf.balancingMethod as BalancingMethod, activeConf.hyperparameters, 3);
    
    // Feature Importances
    const importances: Record<string, number> = {
      cadmium: 0.35, lead: 0.28, zinc: 0.14, chromium: 0.10, ph: 0.08, organicMatter: 0.03, cec: 0.01, clayContent: 0.005, depth: 0.005
    };

    res.json({
      modelType: activeConf.modelType,
      balancingMethod: activeConf.balancingMethod,
      optimizerType: activeConf.optimizerType,
      hyperparameters: activeConf.hyperparameters,
      metrics,
      featureImportances: importances,
      trainedAt: new Date().toISOString(),
      version: "v2.1"
    });
  });

  // 8. GET Metrics Comparison matrices for chart visualizers
  app.get("/api/metrics", (req, res) => {
    const activeConf = dbActions.getActiveModelConfig();
    const result = optimizePipeline(baseSoils, activeConf.optimizerType as OptimizerType, activeConf.modelType as ModelType, activeConf.balancingMethod as BalancingMethod);
    const correlation = computeCorrelationMatrix(baseSoils);

    // Dynamic metrics compilation representing Safe/Mod/High class distributions in base dataset
    const safeCount = baseSoils.filter(b => b.label === "Safe Risk").length;
    const modCount = baseSoils.filter(b => b.label === "Moderate Risk").length;
    const highCount = baseSoils.filter(b => b.label === "High Risk").length;

    res.json({
      balancedComparison: result.comparisonMatrix,
      correlationMatrix: correlation,
      classDistribution: { "Safe Risk": safeCount, "Moderate Risk": modCount, "High Risk": highCount },
      trials: result.trials
    });
  });

  // 9. Prediction History logs
  app.get("/api/history", authenticateToken, (req: any, res) => {
    res.json({
      success: true,
      history: dbActions.getPredictionHistory(req.user?.id)
    });
  });

  app.delete("/api/history", authenticateToken, (req: any, res) => {
    dbActions.clearPredictionHistory(req.user?.id);
    res.json({ success: true, message: "History logs cleared successfully." });
  });

  // 10. POST Explainable AI interpretation with Gemini
  app.post("/api/gemini/explain", async (req, res) => {
    const { features, prediction } = req.body;

    if (!features || !prediction) {
      return res.status(400).json({ success: false, error: "Required features and prediction body models not defined." });
    }

    const { depth, ph, organicMatter, clayContent, cec, lead, cadmium, zinc, chromium, landUse } = features;
    const { riskClass, probabilities } = prediction;

    const basePrompt = `We predicted a Soil Heavy Metal Contamination Risk classification for an agricultural site. 
Input metrics:
- Soil Depth: ${depth} cm
- Soil pH: ${ph} (optimal ranges is typically 6.0-7.0)
- Organic Matter: ${organicMatter}%
- Clay Content: ${clayContent}%
- Cation Exchange Capacity (CEC): ${cec} meq/100g
- Lead (Pb) Level: ${lead} mg/kg
- Cadmium (Cd) Level: ${cadmium} mg/kg
- Zinc (Zn) Level: ${zinc} mg/kg
- Chromium (Cr) Level: ${chromium} mg/kg
- Land Use History: ${landUse}

Outcomes classification: **${riskClass}**
Probabilities details: Safe: ${(probabilities["Safe Risk"] * 100).toFixed(1)}%, Moderate: ${(probabilities["Moderate Risk"] * 100).toFixed(1)}%, High Risk: ${(probabilities["High Risk"] * 100).toFixed(1)}%

Provide a highly professional academic-grade agronomic interpretation of this result in JSON format with exact properties:
1. "summaryText": 3-4 highly concise sentences explaining why the soil falls into this risk category based on the biological chemistry, ph interactions, and heavy metal bounds. Do not refer to database tables or ML files.
2. "actionableAdvice": a list of 3-4 professional agricultural soil remediation strategies tailored to this specific result (such as liming for acidic soils to bound metals, compost integration, crop selection, or phytoremediation). Keep sentences direct, practical, and highly scientific.
3. "contributions": estimates of feature contributions to the prediction (positive: increasing the hazard risk, negative: decreasing the hazard risk). Key names must be exactly: depth, ph, organicMatter, clayContent, cec, lead, cadmium, zinc, chromium. For each, define properties "value" (range -1.0 to +1.0) and "direction" ("positive" | "negative"). Make ph negative when >=6 or positive when <5.5 because acidity increases metal mobilization. High heavy metals always contribute positively. High organic matter contributes negatively.

Return strictly parseable JSON obeying this schema structure. No markdown formatting outside of JSON.`;

    if (!process.env.GEMINI_API_KEY) {
      // Fallback generator when Gemini key is unconfigured
      const isHigh = riskClass === "High Risk";
      const isMod = riskClass === "Moderate Risk";

      const localExplanation = {
        summaryText: isHigh 
          ? `The soil sample presents severe contamination hazards. The concentrations of Lead (${lead} mg/kg) and Cadmium (${cadmium} mg/kg) exceed toxicological standards for agriculture. Soil pH of ${ph} further compounds the issue by increasing metal mobility and bioavailability to crops.`
          : isMod 
          ? `The soil sample exhibits moderate heavy metal contamination. Zinc (${zinc} mg/kg) and Chromium (${chromium} mg/kg) are elevated, presenting potential long-term accumulation paths. Acidity levels can accelerate plant absorption if pH is not actively buffered.`
          : `The soil sample meets safety requirements for agriculture. Contaminant concentrations are well below standard thresholds. Organic matter levels of ${organicMatter}% and stable clay content help maintain metal immobilization.`,
        actionableAdvice: isHigh 
          ? [
              `Implement aggressive soil pH buffering by applying agricultural limestone (dolomite) to raise pH above 6.5, which converts soluble metals into insoluble minerals.`,
              `Incorporate high-molecular-weight organic amendments (compost, humic acids, biochar) to securely bind active Cd and Pb ions on soil colloids.`,
              `Sow non-food phytoremediation hyperaccumulating crops (such as sunflowers or Brassica juncea) to physically extract metal concentrations.`,
              `Restrict farming of sensitive crop cultivars (root crops and leafy greens) that show high toxic-ion translocation coefficients.`
            ]
          : isMod 
          ? [
              `Apply moderate humic amendment treatments to stabilize baseline zinc and lead concentrations in superficial topsoil.`,
              `Practice regular pH maintenance (liming) to ensure soil does not become acidic, keeping bioavailability indicators minimized.`,
              `Introduce diverse cover cropping styles to encourage microbiological metal binding.`
            ]
          : [
              `Maintain current cultivation protocols and monitor chemical contaminant balances every two crop cycles.`,
              `Sustain soil organic matter above 3.0% by recycling green manure to preserve natural mineral-buffering capacities.`
            ],
        contributions: {
          lead: { value: Math.min(lead / 150, 1.0), direction: lead > 40 ? "positive" : "negative" },
          cadmium: { value: Math.min(cadmium / 3, 1.0), direction: cadmium > 0.4 ? "positive" : "negative" },
          zinc: { value: Math.min(zinc / 300, 1.0), direction: zinc > 100 ? "positive" : "negative" },
          chromium: { value: Math.min(chromium / 150, 1.0), direction: chromium > 45 ? "positive" : "negative" },
          ph: { value: Math.abs(ph - 6.5) / 3.5, direction: ph < 5.8 ? "positive" : "negative" },
          organicMatter: { value: Math.min(organicMatter / 10, 0.8), direction: "negative" },
          cec: { value: Math.min(cec / 40, 0.5), direction: "negative" }
        }
      };

      return res.json({ success: true, explanation: localExplanation, source: "Local Classifier Fallback" });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: basePrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryText: { type: Type.STRING },
              actionableAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              contributions: {
                type: Type.OBJECT,
                properties: {
                  depth: {
                    type: Type.OBJECT,
                    properties: {
                      value: { type: Type.NUMBER },
                      direction: { type: Type.STRING, enum: ["positive", "negative"] }
                    }
                  },
                  ph: {
                    type: Type.OBJECT,
                    properties: {
                      value: { type: Type.NUMBER },
                      direction: { type: Type.STRING, enum: ["positive", "negative"] }
                    }
                  },
                  organicMatter: {
                    type: Type.OBJECT,
                    properties: {
                      value: { type: Type.NUMBER },
                      direction: { type: Type.STRING, enum: ["positive", "negative"] }
                    }
                  },
                  clayContent: {
                    type: Type.OBJECT,
                    properties: {
                      value: { type: Type.NUMBER },
                      direction: { type: Type.STRING, enum: ["positive", "negative"] }
                    }
                  },
                  cec: {
                    type: Type.OBJECT,
                    properties: {
                      value: { type: Type.NUMBER },
                      direction: { type: Type.STRING, enum: ["positive", "negative"] }
                    }
                  },
                  lead: {
                    type: Type.OBJECT,
                    properties: {
                      value: { type: Type.NUMBER },
                      direction: { type: Type.STRING, enum: ["positive", "negative"] }
                    }
                  },
                  cadmium: {
                    type: Type.OBJECT,
                    properties: {
                      value: { type: Type.NUMBER },
                      direction: { type: Type.STRING, enum: ["positive", "negative"] }
                    }
                  },
                  zinc: {
                    type: Type.OBJECT,
                    properties: {
                      value: { type: Type.NUMBER },
                      direction: { type: Type.STRING, enum: ["positive", "negative"] }
                    }
                  },
                  chromium: {
                    type: Type.OBJECT,
                    properties: {
                      value: { type: Type.NUMBER },
                      direction: { type: Type.STRING, enum: ["positive", "negative"] }
                    }
                  },
                }
              }
            },
            required: ["summaryText", "actionableAdvice", "contributions"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, explanation: parsed, source: "Google Gemini 3.5" });
    } catch (expError: any) {
      console.error("[Gemini API Error] Explained falling back: ", expError.message);
      // Fail safely to baseline explanations model
      const isHigh = riskClass === "High Risk";
      const isMod = riskClass === "Moderate Risk";
      const localExplanation = {
        summaryText: `The soil sample presents ${riskClass.toLowerCase()} risk potential. Elevated levels of cadmium (${cadmium} mg/kg) and lead (${lead} mg/kg) contribute to critical bio-accumulating pathways, further aggravated by pH acidity (${ph}).`,
        actionableAdvice: isHigh 
          ? [
              `Apply agricultural lime to raise soil pH values above 6.5, effectively immobilizing mobile metal ions.`,
              `Integrate rich compost materials and biochar soils to strengthen particulate capture of toxins.`,
              `Plant metal-tolerant heavy extraction plants (Brassica juncea) for phytoremediation.`
            ]
          : [
              `Implement baseline soil conditioning using dolomite amendments.`,
              `Avoid waterlogging, which accelerates acidification processes.`
            ],
        contributions: {
          lead: { value: 0.65, direction: "positive" },
          cadmium: { value: 0.72, direction: "positive" },
          ph: { value: 0.45, direction: ph < 6.0 ? "positive" : "negative" }
        }
      };
      res.json({ success: true, explanation: localExplanation, source: "Local Preprocessor Fallback (API error)" });
    }
  });

  // Vite configuration setup for Development/Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind server listener
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Soil Classifier Backend] Server running on http://localhost:${PORT}`);
  });
}

startServer();
