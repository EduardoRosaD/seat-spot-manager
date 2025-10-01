# 🚀 Sistema Serverless - Apenas Vercel

Sistema configurado para funcionar **exclusivamente** com as funções serverless da Vercel.

## ⚡ Como Usar

### **Desenvolvimento:**
Para testar as APIs em desenvolvimento, use o Vercel CLI:

```bash
# Instalar Vercel CLI globalmente (uma vez)
npm install -g vercel

# Rodar em modo de desenvolvimento com APIs funcionando
vercel dev
```

Isso iniciará:
- Frontend no `http://localhost:3000`
- APIs serverless funcionando em `/api/*`

### **Produção:**
```bash
git push origin main
# Deploy automático na Vercel
```

## 🔗 Endpoints Disponíveis

Após rodar `vercel dev` ou deploy:

- **Formulário**: `http://localhost:3000` (dev) ou `https://seu-projeto.vercel.app` (prod)
- **Enviar Email**: `POST /api/send-email`
- **Ver Leads**: `GET /api/leads`
- **Health Check**: `GET /api/health`

## 🎯 Fluxo Simples

1. **Usuário preenche** formulário no site
2. **Frontend faz** `POST /api/send-email`
3. **API salva** no MongoDB
4. **API envia** emails via OAuth2
5. **Usuário recebe** confirmação

---

**Sistema limpo e direto. Apenas Vercel serverless!** 🚀