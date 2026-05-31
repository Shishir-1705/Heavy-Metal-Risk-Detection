/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { User, PredictionHistoryRecord, UploadedDatasetRecord, SoilFeatures, RiskClass } from "../types";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

interface DatabaseSchema {
  users: User[];
  predictionHistory: PredictionHistoryRecord[];
  uploadedDatasets: UploadedDatasetRecord[];
  activeModelConfig: {
    modelType: string;
    balancingMethod: string;
    optimizerType: string;
    hyperparameters: Record<string, any>;
  };
}

// Default initial state
const INITIAL_DATABASE: DatabaseSchema = {
  users: [
    {
      id: "admin-id-123",
      username: "agricultural_expert",
      email: "expert@soil.org",
      passwordHash: crypto.createHash("sha256").update("password123").digest("hex"),
      createdAt: new Date().toISOString()
    }
  ],
  predictionHistory: [],
  uploadedDatasets: [],
  activeModelConfig: {
    modelType: "XGBoost",
    balancingMethod: "ADASYN",
    optimizerType: "Optuna Optimization",
    hyperparameters: { n_estimators: 100, learning_rate: 0.1, max_depth: 6 }
  }
};

// Ensure database file and data directory exist
function initDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATABASE, null, 2), "utf-8");
  }
}

function loadDb(): DatabaseSchema {
  initDb();
  try {
    const content = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    return INITIAL_DATABASE;
  }
}

function saveDb(db: DatabaseSchema) {
  initDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// Unique token generator (HMAC session signature)
const JWT_SECRET = process.env.JWT_SECRET || "soil_contamination_secret_key_99812";

export function generateToken(payload: { id: string; email: string; username: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { id: string; email: string; username: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const computedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== computedSig) return null;

    const decodedBody = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (decodedBody.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }

    return {
      id: decodedBody.id,
      email: decodedBody.email,
      username: decodedBody.username
    };
  } catch (e) {
    return null;
  }
}

// Database Actions
export const dbActions = {
  // Authentication
  signUp: (username: string, email: string, passwordPlain: string): { success: boolean; user?: any; error?: string } => {
    const db = loadDb();
    
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "An account with this email already exists" };
    }
    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: "Username is already taken" };
    }

    const passwordHash = crypto.createHash("sha256").update(passwordPlain).digest("hex");
    const newUser: User = {
      id: "usr_" + crypto.randomUUID(),
      username,
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDb(db);

    return {
      success: true,
      user: { id: newUser.id, username: newUser.username, email: newUser.email }
    };
  },

  login: (email: string, passwordPlain: string): { success: boolean; user?: any; token?: string; error?: string } => {
    const db = loadDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    const inputHash = crypto.createHash("sha256").update(passwordPlain).digest("hex");
    if (user.passwordHash !== inputHash) {
      return { success: false, error: "Invalid email or password" };
    }

    const token = generateToken({ id: user.id, email: user.email, username: user.username });

    return {
      success: true,
      user: { id: user.id, username: user.username, email: user.email },
      token
    };
  },

  // Prediction Log archiving
  addPredictionHistory: (userId: string | undefined, features: SoilFeatures, prediction: { riskClass: RiskClass; confidence: string; probabilities: Record<RiskClass, number>; }) => {
    const db = loadDb();
    const record: PredictionHistoryRecord = {
      id: "pred_" + crypto.randomBytes(8).toString("hex"),
      userId,
      timestamp: new Date().toISOString(),
      features,
      prediction
    };
    db.predictionHistory.unshift(record); // Prepend so most recent is first
    saveDb(db);
    return record;
  },

  getPredictionHistory: (userId?: string): PredictionHistoryRecord[] => {
    const db = loadDb();
    if (userId) {
      return db.predictionHistory.filter(p => p.userId === userId);
    }
    return db.predictionHistory;
  },

  clearPredictionHistory: (userId?: string) => {
    const db = loadDb();
    if (userId) {
      db.predictionHistory = db.predictionHistory.filter(p => p.userId !== userId);
    } else {
      db.predictionHistory = [];
    }
    saveDb(db);
  },

  // Dataset Uploads Registry
  registerDataset: (filename: string, rowCount: number, phMean: number, organicMatterMean: number, distribution: Record<RiskClass, number>): UploadedDatasetRecord => {
    const db = loadDb();
    const record: UploadedDatasetRecord = {
      id: "ds_" + crypto.randomBytes(6).toString("hex"),
      filename,
      rowCount,
      uploadedAt: new Date().toISOString(),
      summary: {
        phMean,
        organicMatterMean,
        classDistribution: distribution as any
      }
    };
    db.uploadedDatasets.unshift(record);
    saveDb(db);
    return record;
  },

  getDatasets: (): UploadedDatasetRecord[] => {
    const db = loadDb();
    return db.uploadedDatasets;
  },

  // Model Config Saver
  getActiveModelConfig: () => {
    const db = loadDb();
    return db.activeModelConfig;
  },

  updateActiveModelConfig: (config: { modelType: string; balancingMethod: string; optimizerType: string; hyperparameters: Record<string, any> }) => {
    const db = loadDb();
    db.activeModelConfig = config;
    saveDb(db);
    return db.activeModelConfig;
  }
};
