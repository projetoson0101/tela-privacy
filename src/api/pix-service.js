const axios = require('axios');

async function criarPix(dados) {
    try {
        // Limpeza do valor
        const apenasNumeros = dados.valor.replace(/[^\d,.]/g, '').replace(',', '.');
        const valor = parseFloat(apenasNumeros);

        if (isNaN(valor) || valor <= 0) {
            throw new Error('Valor inválido para o PIX');
        }

        console.log(`📡 Gerando PIX via AlphaBot: R$ ${valor}`);

        const response = await axios.post(
            'https://alphabotvips.com/api/v1/alpha-wallet/payments',
            { amount: valor, description: `Assinatura ${dados.plano || 'Privacy'}` },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.ALPHABOT_API_KEY}`,
                    'X-Client-Id': process.env.ALPHABOT_CLIENT_ID,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.data || !response.data.brcode) {
            throw new Error('AlphaBot não retornou dados de PIX válidos.');
        }

        console.log('✅ PIX AlphaBot gerado com sucesso');
        
        return {
            qr_code: response.data.brcode,
            qr_code_base64: response.data.qr_code_base64 || ''
        };
    } catch (err) {
        console.error('❌ Erro na API do AlphaBot:', err.response?.data || err.message);
        throw new Error('Falha ao conectar com o gateway de PIX (AlphaBot).');
    }
}

module.exports = { criarPixSyncPay: criarPix };
