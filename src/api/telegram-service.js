const axios = require('axios');

async function gerarLinkTelegram(plano) {
    const LINK_VAZADOS = "https://t.me/+8smfMcsGAOIzZWRh";
    const LINK_GERAL = "https://t.me/+GH-SHn8p_OIxODgx";
    
    if (plano && (plano.toLowerCase().includes('vazado') || plano === 'Vazados da Mirella')) {
        return LINK_VAZADOS;
    }
    return LINK_GERAL;
}

async function enviarMensagemTelegram(msg) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_GROUP_VIPZINHO; // Exemplo
    if (!token || !chatId) return;
    
    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: msg,
            parse_mode: 'Markdown'
        });
    } catch (e) { console.error('Erro Telegram:', e.message); }
}

module.exports = { gerarLinkTelegram, enviarMensagemTelegram };
