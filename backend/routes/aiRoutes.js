import express from "express";

const router = express.Router();

// POST /api/ai/chat (PUBLIC)
router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "messages[] is required" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Missing GROQ_API_KEY in .env" });
    }

    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    // Keep last 24 messages only
    const trimmed = messages.slice(-24);

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: trimmed,
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({
        message: data?.error?.message || "Groq request failed",
      });
    }

    const reply = data?.choices?.[0]?.message?.content || "";
    return res.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    return res.status(500).json({ message: "AI chat failed" });
  }
});

export default router;
