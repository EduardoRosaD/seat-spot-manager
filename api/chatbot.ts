// import makeWASocket, {
//   useMultiFileAuthState,
//   DisconnectReason
// } from '@whiskeysockets/baileys'
// import qrcode from 'qrcode-terminal'
// import 'dotenv/config'
// import { createClient } from '@supabase/supabase-js'

// const supabase = createClient(
//   process.env.VITE_SUPABASE_URL!,
//   process.env.VITE_SUPABASE_KEY!
// )

// async function startBot() {
//   const { state, saveCreds } = await useMultiFileAuthState('./auth')

//   const sock = makeWASocket({
//     auth: state,
//     printQRInTerminal: true
//   })

//   sock.ev.on('creds.update', saveCreds)

//   sock.ev.on('connection.update', (update) => {
//     const { connection, lastDisconnect } = update
//     if (connection === 'close') {
//       const reason = lastDisconnect?.error?.output?.statusCode
//       if (reason !== DisconnectReason.loggedOut) {
//         startBot()
//       }
//     } else if (connection === 'open') {
//       console.log('✅ BOT conectado ao WhatsApp!')
//     }
//   })

//   sock.ev.on('messages.upsert', async ({ messages }) => {
//     const msg = messages[0]
//     if (!msg.message || !msg.key.remoteJid) return

//     const from = msg.key.remoteJid
//     const text = msg.message.conversation || ' '

//     // Exemplo simples de fluxo
//     if (text.toLowerCase() === 'oi') {
//       await sock.sendMessage(from, {
//         text: 'Olá! Me envie sua localização.'
//       })
//       return
//     }
//   })
// }

// startBot()
