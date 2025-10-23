// /opt/webhook3/server.js
const express = require("express");
const compression = require("compression");
const path = require("path");

// ---- basics ----
const app = express();
const base = "/webhook3";
const root = __dirname;
const port = 9089;

function extractOpenAiText(payload) {
  if (!payload) return "";
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  if (Array.isArray(payload.output)) {
    return payload.output
      .map((segment) => Array.isArray(segment?.content)
        ? segment.content.map((part) => part?.text || "").join("")
        : "")
      .join("")
      .trim();
  }
  if (Array.isArray(payload.choices)) {
    return payload.choices
      .map((choice) => Array.isArray(choice?.message?.content)
        ? choice.message.content.map((part) => part?.text || "").join("")
        : choice?.message?.content || "")
      .join("")
      .trim();
  }
  return "";
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
    const {
      provider = "gemini",
      prompt,
      model,
      temperature = 0.65,
      topP = 0.9,
    } = req.body || {};

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "prompt (string) is required" });
    }

    if (provider === "openai") {
      const openAiKey = process.env.OPENAI_API_KEY;
      if (!openAiKey) {
        return res.status(500).json({ error: "Missing OPENAI_API_KEY on server" });
      }

      const upstream = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4.1",
          input: prompt,
          temperature,
          top_p: topP,
          max_output_tokens: 1024,
        }),
      });

      const data = await upstream.json();
      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: "upstream_error", details: data });
      }

      const text = extractOpenAiText(data);
      return res.json({ text, raw: data });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });
    }

    const modelId = model || "models/gemini-2.5-pro";
    const generationConfig = {
      temperature,
      topP,
      responseMimeType: "text/plain",
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${encodeURIComponent(geminiKey)}`;
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
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: "upstream_error", details: data });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    return res.json({ text, raw: data });
  } catch (err) {
    console.error("Generation proxy error:", err);
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
