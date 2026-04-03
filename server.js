const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 🔥 SUPABASE
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

// ✅ REGISTER
app.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  try {
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

  } catch (err) {
    res.status(500).json({ error: "Erro no registro" });
  }
});

// ✅ LOGIN
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

// ===== INTEGRAÇÕES =====

app.post("/save-integrations", async (req, res) => {
  const {
    user_id,
    evolution_url,
    evolution_key,
    n8n_webhook,
    openai_key,
    assistant_id
  } = req.body;

  const { error } = await supabase.from("integrations").upsert({
    user_id,
    evolution_url,
    evolution_key,
    n8n_webhook,
    openai_key,
    assistant_id
  });

  if (error) return res.status(400).json({ error: error.message });

  res.json({ success: true });
});

// ===== WHATSAPP (EVOLUTION + N8N) =====

app.post("/connect-whatsapp", async (req, res) => {
  const { user_id } = req.body;

  // 🔥 PEGA SEMPRE A ÚLTIMA INTEGRAÇÃO
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", user_id)
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return res.status(400).json({ error: "Integrações não encontradas" });
  }

  const integration = data[0];

  try {
    const instanceName = "weevzap_" + user_id;

    // 🔥 CHAMADA CORRETA DA EVOLUTION
    const response = await axios.post(
      `${integration.evolution_url}/instance/create`,
      {
        instanceName: instanceName
      },
      {
        headers: {
          "Content-Type": "application/json",
          apikey: integration.evolution_key
        }
      }
    );

    res.json(response.data);

  } catch (err) {
    console.log("ERRO EVOLUTION:", err.response?.data || err.message);

    res.status(500).json({
      error: err.response?.data?.message || "Erro ao conectar WhatsApp"
    });
  }
});

// ===== START =====

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🔥 SaaS rodando na porta " + PORT));
