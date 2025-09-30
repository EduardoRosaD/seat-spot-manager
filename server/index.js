import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(cors({
  origin: '*', // URL do frontend Vite
  credentials: true,
}));
app.use(express.json());

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_KEY);

app.post('/create-user', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
