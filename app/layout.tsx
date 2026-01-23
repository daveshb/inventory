import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inventory Telegram Bot - Backend API',
  description: 'Backend-only inventory management system via Telegram Bot',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
          <h1>📦 Inventory Telegram Bot</h1>
          <p>
            Este es un servidor de API puro (Next.js backend). No hay UI.
          </p>
          <h2>Endpoints Disponibles</h2>
          <ul>
            <li>
              <code>POST /api/telegram</code> - Webhook de Telegram
            </li>
            <li>
              <code>GET /api/health</code> - Health check
            </li>
            <li>
              <code>POST /api/telegram/set-webhook</code> - Configurar webhook
            </li>
          </ul>
          <h2>Setup</h2>
          <ol>
            <li>Configura variables de entorno (.env.local)</li>
            <li>Crea bot en BotFather (@BotFather)</li>
            <li>Crea base de datos MongoDB Atlas</li>
            <li>Deploy a Vercel</li>
            <li>Llama POST /api/telegram/set-webhook</li>
          </ol>
          <p>
            Ver <code>README.md</code> para instrucciones detalladas.
          </p>
          {children}
        </main>
      </body>
    </html>
  );
}

