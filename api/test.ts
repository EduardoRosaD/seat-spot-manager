import makeWASocket, { useMultiFileAuthState, WASocket, ConnectionState } from '@whiskeysockets/baileys';
import P from 'pino';
import qrcode from 'qrcode-terminal';

async function start(): Promise<void> {
  // cria ou carrega estado de autenticação em ./auth_info
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock: WASocket = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
  });

  // Evento de conexão
  sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
    const { connection, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });
    console.log('Status:', connection);
  });

  // Sempre salve credenciais quando mudar
  sock.ev.on('creds.update', saveCreds);
}

start().catch((err) => console.error('Erro ao iniciar:', err));
