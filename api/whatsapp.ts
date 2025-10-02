// File: /api/reservas.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Conexão com o Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_KEY!
);

// Middleware simples para CORS
const allowCors = (fn) => async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return fn(req, res);
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    const body = req.body;
    const params = body?.queryResult?.parameters;
    console.log(body.queryResult)
    if (!params) {
      return res.status(400).json({ success: false, message: 'Parâmetros não encontrados' });
    }

    const {
      quantidade_mesas,
      quantidade_cadeiras,
      valor_total,
      nome_usuario,
      endereco,
      telefone
    } = params;

    // Inserir no Supabase
    const { data, error } = await supabase
      .from('reservas')
      .insert([
        {
          quantidade_mesas,
          quantidade_cadeiras,
          valor_total,
          nome_usuario,
          endereco,
          telefone
        }
      ]);

    if (error) {
      console.error('Erro ao salvar reserva:', error);
      return res.status(500).json({ success: false, message: 'Erro ao salvar no banco' });
    }

    console.log('✅ Reserva salva:', data);

    // Resposta para o Dialogflow
    res.json({
      fulfillmentText: `Reserva de ${quantidade_mesas} mesas e ${quantidade_cadeiras} cadeiras registrada com sucesso para ${nome_usuario}.`
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

export default allowCors(handler);
