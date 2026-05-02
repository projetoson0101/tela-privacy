const axios = require('axios');

const BASE_URL = 'https://api.syncpay.io.br';

async function getAuthToken() {
    try {
        const payload = {
            client_id: process.env.SYNCPAY_CLIENT_ID,
            client_secret: process.env.SYNCPAY_CLIENT_SECRET
        };
        const response = await axios.post(`${BASE_URL}/api/partner/v1/auth-token`, payload);
        return response.data.access_token;
    } catch (err) {
        console.error('❌ Erro ao obter token SyncPay:', err.response?.data || err.message);
        throw new Error('Falha na autenticação com SyncPay');
    }
}

async function criarPixSyncPay(dados) {
    try {
        // Limpeza do valor
        const apenasNumeros = dados.valor.replace(/[^\d,.]/g, '').replace(',', '.');
        const valor = parseFloat(apenasNumeros);

        if (isNaN(valor) || valor <= 0) {
            throw new Error('Valor inválido para o PIX');
        }

        const token = await getAuthToken();

        const payload = {
            amount: valor,
            description: `Assinatura ${dados.plano || 'Privacy'}`,
            webhook_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/webhook/syncpay`,
            client: {
                name: dados.nome || 'Cliente Privacy',
                cpf: dados.cpf || '00000000000',
                email: dados.email || 'cliente@privacy.com',
                phone: dados.whatsapp || '11999999999'
            }
        };

        console.log(`📡 Gerando PIX SyncPay: R$ ${valor}`);

        const response = await axios.post(`${BASE_URL}/api/partner/v1/cash-in`, payload, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('✅ PIX SyncPay gerado com sucesso');
        
        // SyncPay retorna pix_code (copia e cola) e qrcode (base64)
        return {
            qr_code: response.data.pix_code,
            qr_code_base64: response.data.qrcode
        };
    } catch (err) {
        const errorDetail = err.response?.data || err.message;
        console.error('❌ Erro na API do SyncPay:', JSON.stringify(errorDetail));
        throw new Error(err.response?.data?.message || err.message);
    }
}

module.exports = { criarPixSyncPay };
