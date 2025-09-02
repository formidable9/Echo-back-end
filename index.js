// Render backend for Echo (CommonJS; works out of the box on Render)
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // v2.x (see package.json)

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health
app.get("/", (_req, res) => res.send("OK"));

// Optional: check that the key is loaded (remove later if you want)
app.get("/keycheck", (_req, res) => {
  const k = process.env.GROQ_API_KEY || "";
  res.json({ ok: !!k, len: k.length, head: k.slice(0, 6) + "..." });
});

// Main endpoint — accepts EITHER {prompt} OR {model,messages}
app.post("/api/ask", async (req, res) => {
  try {
    let payload;

    if (Array.isArray(req.body?.messages)) {
      // Pass-through mode (original site format)
      payload = {
model: req.body.model ||llama-3.3-70b-versatile, 
        messages: req.body.messages,
        temperature: typeof req.body.temperature === "number" ? req.body.temperature : 0.9,
        stream: false
      };
    } else if (typeof req.body?.prompt === "string") {
      // Simple mode (new format)
      payload = {
   model: "llama-3.3-70b-versatile", 
     messages: [
      { role: "system", content: "You are Echo, a helpful AI assistant." },
      { role: "user", content: String(req.body.prompt) }
    ],       ],
        temperature: 0.9,
        stream: false
      };
    } else {
      return res.status(400).json({ error: "Send either {prompt} or {model, messages}." });
    }

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Proxy error", detail: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Echo backend running on " + PORT));
