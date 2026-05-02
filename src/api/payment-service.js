const Stripe = require('stripe');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const mpClient = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'test_placeholder',
    options: { timeout: 5000 }
});
const mpPayment = new Payment(mpClient);

async function criarIntencaoStripe(dados) {
    const valorCentavos = Math.round(dados.valor * 100);
    return await stripe.paymentIntents.create({
        amount: valorCentavos, currency: 'brl', description: `Privacy - ${dados.plano}`, 
        metadata: { plano: dados.plano, email: dados.email }, 
        payment_method_types: ['card']
    });
}

async function processarPagamentoMP(dados) {
    const paymentData = {
        body: {
            transaction_amount: Number(dados.transaction_amount),
            token: dados.token,
            description: `Privacy - ${dados.plano}`,
            installments: Number(dados.installments),
            payment_method_id: dados.payment_method_id,
            issuer_id: dados.issuer_id,
            payer: {
                email: dados.payer.email,
                identification: {
                    type: dados.payer.identification.type,
                    number: dados.payer.identification.number
                }
            },
            metadata: { plano: dados.plano }
        }
    };
    return await mpPayment.create(paymentData);
}

module.exports = { criarIntencaoStripe, processarPagamentoMP };
