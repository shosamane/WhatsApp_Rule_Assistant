// /opt/webhook3/server.js
const express = require("express");
const compression = require("compression");
const path = require("path");
let MongoClient = null;
try { ({ MongoClient } = require('mongodb')); } catch (e) { /* mongodb optional until installed */ }

// ---- basics ----
const app = express();
const base = "/webhook3";
const root = __dirname;
const port = 9089;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const mongoDbName = process.env.MONGODB_DB || 'whatsapp_rule_assistant';
const mongoColl = process.env.MONGODB_COLLECTION || 'submissions';
let mongoClient = null;
async function getMongo() {
  if (!MongoClient) throw new Error('mongodb driver not installed. Run: npm install mongodb');
  if (mongoClient && mongoClient.topology?.isConnected()) return mongoClient;
  mongoClient = new MongoClient(mongoUri, { ignoreUndefined: true });
  await mongoClient.connect();
  return mongoClient;
}

app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(compression());
app.use(`${base}/api/`, express.json({ limit: "1mb" }));

// ---- static site under /webhook3 ----
app.use(base, express.static(root, { extensions: ["html"] }));

app.use(`${base}/api/`, express.json({ limit: "1mb" }));

app.post(`${base}/api/generate`, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });

    const {
      prompt,
      model = "models/gemini-2.5-pro",
      temperature = 0.65,
      topP = 0.9,
    } = req.body || {};

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "prompt (string) is required" });
    }

    const generationConfig = {
      temperature,
      topP,
      responseMimeType: "text/plain",
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }]}],
      generationConfig,
    };

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: "upstream_error", details: data });

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    return res.json({ text, raw: data });
  } catch (err) {
    console.error("Gemini proxy error:", err);
    return res.status(500).json({ error: "proxy_failure" });
  }
});

// ---- get completion code ----
app.post(`${base}/api/get-code`, async (req, res) => {
  try {
    const { platform, userId } = req.body || {};

    // Validate platform
    const validPlatforms = ['clickworker', 'prolific', 'referral'];
    if (!platform || !validPlatforms.includes(platform)) {
      return res.status(400).json({ error: 'invalid_platform', hint: 'Platform must be one of: clickworker, prolific, referral' });
    }

    // Validate userId
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ error: 'missing_userId' });
    }

    const client = await getMongo();
    const db = client.db(mongoDbName);
    const coll = db.collection('completion_codes');

    // Atomically find and update one available code for the specified platform
    const result = await coll.findOneAndUpdate(
      {
        platform: platform,
        sharedWithPlatform: true,
        sharedWithParticipant: { $ne: true }
      },
      {
        $set: {
          sharedWithParticipant: true,
          userId: userId,
          usedAt: new Date().toISOString()
        }
      },
      { returnDocument: 'after' }
    );

    console.log('[get-code] findOneAndUpdate result:', JSON.stringify(result, null, 2));

    // Handle both result.value (newer drivers) and result directly (older drivers)
    const document = result.value || result;

    if (!document || !document.code) {
      console.error('[get-code] No document found. Result structure:', result);
      return res.status(404).json({ error: 'no_codes_available' });
    }

    console.log('[get-code] Successfully retrieved code:', document.code);
    return res.json({ code: document.code });
  } catch (err) {
    console.error('get-code error', err);
    if (/mongodb driver not installed/i.test(String(err))) {
      return res.status(500).json({ error: 'driver_missing', hint: 'Install with: npm install mongodb' });
    }
    return res.status(500).json({ error: 'code_retrieval_failed' });
  }
});

// ---- store submission ----
app.post(`${base}/api/store`, async (req, res) => {
  try {
    const payload = req.body || {};
    // Basic sanity: require a sessionId
    if (!payload.sessionId) return res.status(400).json({ error: 'missing_sessionId' });

    const sessionId = payload.sessionId;
    const now = new Date().toISOString();

    // Set timestamps
    if (!payload.createdAt) payload.createdAt = now;
    payload.updatedAt = now;
    payload.serverReceivedAt = now;
    payload.remote = { ip: req.ip };

    const client = await getMongo();
    const db = client.db(mongoDbName);
    const coll = db.collection(mongoColl);

    // Extract createdAt to avoid conflict between $set and $setOnInsert
    const { createdAt, ...updateFields } = payload;

    // Use updateOne with upsert to update existing document or create new one
    const result = await coll.updateOne(
      { sessionId: sessionId },
      {
        $set: updateFields,
        $setOnInsert: { createdAt: createdAt || now }
      },
      { upsert: true }
    );

    return res.json({
      ok: true,
      sessionId: sessionId,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount
    });
  } catch (err) {
    console.error('store error', err);
    if (/mongodb driver not installed/i.test(String(err))) {
      return res.status(500).json({ error: 'driver_missing', hint: 'Install with: npm install mongodb' });
    }
    return res.status(500).json({ error: 'store_failed' });
  }
});

// ---- SPA fallback (after API route) ----
app.use(base, (_req, res) => {
  res.sendFile(path.join(root, "index.html"));
});

// ---- bind to loopback (Apache reverse proxies HTTPS here) ----
app.listen(port, "127.0.0.1", () => {
  console.log(`webhook3 listening at http://127.0.0.1:${port}${base}`);
});
