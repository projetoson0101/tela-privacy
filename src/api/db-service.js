const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let usarFallbackJSON = false;
const DB_PATH = path.join(__dirname, '../../data.json');

function getPoolConfig(connectionString) {
    return {
        connectionString,
        ssl: (connectionString || "").includes('@') || process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
        connectionTimeoutMillis: 5000,
    };
}

async function inicializarDB() {
    const urls = [process.env.DATABASE_URL, process.env.DATABASE_PUBLIC_URL].filter(Boolean);
    let sucess = false;

    for (const url of urls) {
        try {
            pool = new Pool(getPoolConfig(url));
            await pool.query('SELECT 1');
            console.log('✅ PostgreSQL Conectado');
            sucess = true;
            break;
        } catch (err) {
            console.error(`❌ Falha no banco: ${err.message}`);
        }
    }

    if (!sucess) {
        console.warn('⚠️ Usando JSON fallback.');
        usarFallbackJSON = true;
    }
}

function carregarDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            const initial = { transacoes: [], usuarios: [], solicitacoes: [] };
            fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
            return initial;
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch { return { transacoes: [], usuarios: [], solicitacoes: [] }; }
}

function salvarDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

async function inserirTransacao(dados) {
    if (usarFallbackJSON) {
        const db = carregarDB();
        const maxId = db.transacoes.length > 0 ? Math.max(...db.transacoes.map(t => t.id)) : 0;
        const item = {
            id: maxId + 1, ...dados,
            criado_em: new Date().toISOString(), aprovado_em: null
        };
        db.transacoes.push(item);
        salvarDB(db);
        return item;
    }
    const result = await pool.query(
        `INSERT INTO transacoes (tipo, plano, valor, status, nome_cliente, email_cliente, cpf_cliente, stripe_payment_id, pushinpay_payment_id, usuario_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [dados.tipo, dados.plano, dados.valor, dados.status, dados.nome_cliente, dados.email_cliente, dados.cpf_cliente, dados.stripe_payment_id, dados.pushinpay_payment_id, dados.usuario_id]
    );
    return result.rows[0];
}

module.exports = { inicializarDB, inserirTransacao, pool };
