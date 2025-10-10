// /opt/webhook3/server.js
const express = require("express");
const compression = require("compression");
const path = require("path");

// ---- basics ----
const app = express();
const base = "/webhook3";
const root = __dirname;
const port = 9089;

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
      model = "models/gemini-2.5-pro",   // you can switch to "models/gemini-2.5-flash" if you prefer
      temperature = 0.65,
      topP = 0.9,
    } = req.body || {};
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "prompt (string) is required" });
    }

    // Pro spends tokens on hidden thinking; cap it so text is produced.
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

// ---- SPA fallback (after API route) ----
app.use(base, (_req, res) => {
  res.sendFile(path.join(root, "index.html"));
});

// ---- bind to loopback (Apache reverse proxies HTTPS here) ----
app.listen(port, "127.0.0.1", () => {
  console.log(`webhook3 listening at http://127.0.0.1:${port}${base}`);
});
