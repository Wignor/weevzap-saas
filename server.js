const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 CONFIG (COLOQUE SUAS CHAVES)
const SUPABASE_URL = "https://gmpogimfcftlydswejjg.supabase.co";
const SUPABASE_KEY = "sb_publishable_eCxoFqbJTRQ2e6k_lh47-A__CxPIXfj";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ TESTE
const path = require("path");

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ CADASTRO
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
      email,
      active: true
    }
  ]);

  res.json({ success: true });
});

// ✅ LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(401).json({ error: error.message });

  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
