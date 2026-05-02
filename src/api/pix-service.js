const axios = require('axios');

async function criarPix(dados) {
    try {
        // Limpeza do valor
        const apenasNumeros = dados.valor.replace(/[^\d,.]/g, '').replace(',', '.');
        const valorNumerico = parseFloat(apenasNumeros);

        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            throw new Error('Valor inválido para o PIX');
        }

        // A NexusPag aceita valor em centavos
        const valorEmCentavos = Math.round(valorNumerico * 100);

        console.log(`📡 Gerando PIX via NexusPag: R$ ${valorNumerico}`);

        const response = await axios.post(
            'https://nexuspag.com/api/pix/create',
            { 
                amount: valorEmCentavos, 
                webhook_url: `${process.env.APP_URL || 'https://privacy-cdjc.onrender.com'}/api/webhook/nexuspag`
            },
            {
                headers: {
                    'x-api-key': process.env.NEXUSPAG_TOKEN,
                    'Content-Type': 'application/json'
                }
            }
        );

        const { transaction } = response.data;

        if (!transaction || !transaction.pix_copia_cola) {
            throw new Error('NexusPag não retornou dados de PIX válidos.');
        }

        console.log(`✅ PIX NexusPag gerado com sucesso (ID: ${transaction.id})`);
        
        return {
            qr_code: transaction.pix_copia_cola,
            qr_code_base64: transaction.qr_code_base64 || ''
        };
    } catch (err) {
        console.error('❌ Erro na API do NexusPag:', err.response?.data || err.message);
        throw new Error('Falha ao conectar com o gateway de PIX (NexusPag).');
    }
}

module.exports = { criarPixSyncPay: criarPix };
