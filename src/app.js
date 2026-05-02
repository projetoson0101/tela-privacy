require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

// Injeção de Serviços (Arquitetura Sênior)
const db = require('./api/db-service');
const payment = require('./api/payment-service');
const pix = require('./api/pix-service');
const telegram = require('./api/telegram-service');

const app = express();

// Middlewares Globais
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Configuração de Pastas (Padrão Engenharia Sênior)
const pastaPublic = path.join(__dirname, '../public');
app.use(express.static(pastaPublic));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/api-docs', express.static(path.join(__dirname, 'api')));

// Inicializa Banco de Dados
db.inicializarDB();

// ── ROTAS DE API ─────────────────────────────────────────────

app.get('/api/config', (req, res) => {
    res.json({ 
        sucesso: true, 
        stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
        mercadopagoPublicKey: process.env.MERCADOPAGO_PUBLIC_KEY || ''
    });
});

app.post('/api/pix/criar', async (req, res) => {
    try {
        console.log('📡 REQUISIÇÃO PIX RECEBIDA:', JSON.stringify(req.body));
        console.log('👤 Cliente:', req.body.email);
        console.log('💵 Plano:', req.body.plano, 'Valor:', req.body.valor);
        
        if (!process.env.NEXUSPAG_TOKEN) {
            console.error('⚠️ NEXUSPAG_TOKEN não configurado no .env');
        }

        const result = await pix.criarPixSyncPay(req.body);
        
        await db.inserirTransacao({ 
            tipo: 'pix', plano: req.body.plano, valor: req.body.valor, 
            status: 'pendente', email_cliente: req.body.email 
        });

        // Mapeamento correto:
        // qr_code_base64 -> Imagem para o usuário escanear
        // qr_code -> Texto para o usuário copiar e colar
        res.json({ 
            sucesso: true, 
            qrCodeUrl: result.qr_code_base64, 
            codigoCopiaECola: result.qr_code
        });
    } catch (e) { 
        res.status(500).json({ sucesso: false, erro: e.message }); 
    }
});

app.post('/api/mercadopago/pagar', async (req, res) => {
    try {
        const response = await payment.processarPagamentoMP(req.body);
        const status = response.status === 'approved' ? 'aprovado' : 'pendente';
        
        await db.inserirTransacao({
            tipo: 'cartao', plano: req.body.plano, valor: req.body.transaction_amount, 
            status: status, email_cliente: req.body.payer.email,
            pushinpay_payment_id: response.id.toString() 
        });

        res.json({ sucesso: true, status: response.status, id: response.id });
    } catch (e) { res.status(500).json({ sucesso: false, erro: e.message }); }
});

app.post('/api/vips/resgatar-link', async (req, res) => {
    try {
        const { email } = req.body;
        // Lógica simplificada de resgate
        const link = await telegram.gerarLinkTelegram('Geral');
        res.json({ sucesso: true, link });
    } catch (e) { res.status(500).json({ sucesso: false, erro: e.message }); }
});

// ── WEBHOOKS ────────────────────────────────────────────────

app.post('/api/webhook/nexuspag', async (req, res) => {
    console.log('✉️ Webhook NexusPag recebido');
    res.sendStatus(200);
});

// ── ROTA PRINCIPAL ──────────────────────────────────────────

app.get('/', (req, res) => {
    res.sendFile(path.join(pastaPublic, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════════════╗
    ║  🚀 PRIVACY PROJECT - SENIOR ARCHITECTURE        ║
    ║  📍 Status: ONLINE                               ║
    ║  🔗 Porta: ${PORT}                                  ║
    ╚══════════════════════════════════════════════════╝
    `);
});
