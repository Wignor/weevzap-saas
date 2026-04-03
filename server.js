const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const SUPABASE_URL = "https://gmpogimfcftlydswejjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_eCxoFqbJTRQ2e6k_lh47-A__CxPIXfj";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== ROTAS =====

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// ===== AUTH =====

app.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) return res.status(400).json({ error: error.message });

  await supabase.from("users").insert([
    {
      id: data.user.id,
      name,
      email
    }
  ]);

  res.json({ success: true });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(401).json({ error: error.message });

  res.json({
    token: data.session.access_token,
    user: data.user
  });
});

// ===== SALVAR INTEGRAÇÕES =====

app.post("/save-integrations", async (req, res) => {
  const { user_id, evolution_url, evolution_key, n8n_webhook, openai_key } = req.body;

  await supabase.from("integrations").upsert({
    user_id,
    evolution_url,
    evolution_key,
    n8n_webhook,
    openai_key
  });

  res.json({ success: true });
});

// ===== SALVAR PROMPT =====

app.post("/save-agent", async (req, res) => {
  const { user_id, prompt } = req.body;

  await supabase.from("agents").upsert({
    user_id,
    prompt
  });

  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 SaaS rodando na porta " + PORT));
