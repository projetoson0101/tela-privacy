
let stripeJS = null;
let stripeElements = null, stripeCardNumber = null, stripeCardExpiry = null, stripeCardCvc = null;
let mpInstance = null;
let cardPaymentBrickController = null;
let precoAtual = '', planoAtual = '', emailAtual = '';

const WHATSAPP_NUMBER = '5567991960050';

// ════════════════════════════════════════════
// FUNÇÕES PRINCIPAIS (ABRIR E SELECIONAR)
// ════════════════════════════════════════════

function abrirCheckout(preco, duracao) {
    console.log('🚀 Abrindo checkout:', preco, duracao);
    precoAtual = preco; planoAtual = duracao;
    
    const elPreco = document.getElementById('modal-preco');
    const elDuracao = document.getElementById('modal-duracao');
    const elRenovacao = document.getElementById('texto-valor-renovacao');
    
    if (elPreco) elPreco.innerText = preco;
    if (elDuracao) elDuracao.innerText = duracao;
    if (elRenovacao) elRenovacao.innerText = preco;

    document.getElementById('step-selecao').classList.remove('hidden');
    document.getElementById('conteudo-pix').classList.add('hidden');
    document.getElementById('conteudo-cartao').classList.add('hidden');
    document.getElementById('conteudo-sucesso').classList.add('hidden');
    document.getElementById('modal-pagamento').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function selecionarMetodo(m) {
    emailAtual = document.getElementById('email-cliente').value.trim();
    if (!emailAtual || !emailAtual.includes('@')) {
        alert('Por favor, informe um e-mail válido para receber o acesso.');
        document.getElementById('email-cliente').focus();
        return;
    }
    
    document.getElementById('step-selecao').classList.add('hidden');
    
    if (m === 'pix') {
        document.getElementById('conteudo-pix').classList.remove('hidden');
        gerarPix(precoAtual, planoAtual);
    } else {
        document.getElementById('conteudo-cartao').classList.remove('hidden');
        // Se o Mercado Pago já estiver pronto, renderiza. Se não, avisa.
        if (typeof MercadoPago !== 'undefined' && mpInstance) {
            renderCardBrick();
        } else {
            alert('O sistema de cartão está terminando de carregar. Por favor, clique em voltar e selecione cartão novamente em 3 segundos.');
        }
    }
}

// ════════════════════════════════════════════
// INICIALIZAÇÃO DE SDKS (STRIPE / MERCADO PAGO)
// ════════════════════════════════════════════

const eStyle = { base: { color: '#ffffff', fontFamily: 'Inter, sans-serif', fontSize: '16px', '::placeholder': { color: '#6b7280' } } };

fetch('/api/config')
    .then(r => r.json())
    .then(d => { 
        if (d.sucesso) {
            // Inicializa Mercado Pago se o script estiver presente
            if (d.mercadopagoPublicKey && typeof MercadoPago !== 'undefined') {
                try {
                    mpInstance = new MercadoPago(d.mercadopagoPublicKey, { locale: 'pt-BR' });
                    console.log('✅ Mercado Pago carregado.');
                } catch (e) { console.error('Erro MP:', e); }
            }
            // Inicializa Stripe como fallback se o script estiver presente
            if (d.stripePublicKey && typeof Stripe !== 'undefined') {
                try {
                    stripeJS = Stripe(d.stripePublicKey);
                    stripeElements = stripeJS.elements();
                    stripeCardNumber = stripeElements.create('cardNumber', { style: eStyle });
                    console.log('✅ Stripe carregado.');
                } catch (e) { console.error('Erro Stripe:', e); }
            }
        } 
    }).catch(e => console.error('Erro config:', e));

// ════════════════════════════════════════════
// LÓGICA DE PAGAMENTO E MODAL
// ════════════════════════════════════════════

async function renderCardBrick() {
    if (!mpInstance) {
        console.error('❌ mpInstance não encontrado');
        return;
    }
    if (cardPaymentBrickController) return;

    console.log('🛠️ Inicializando Brick para:', precoAtual, planoAtual);
    const bricksBuilder = mpInstance.bricks();
    
    // Converte R$ 9,90 para 9.90
    const valorLimpo = parseFloat(precoAtual.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    console.log('💰 Valor processado:', valorLimpo);

    const settings = {
        initialization: {
            amount: valorLimpo,
            payer: {
                email: emailAtual || 'teste@teste.com',
                identification: {
                    type: 'CPF',
                    number: '' // Deixa vazio para o usuário preencher no formulário
                }
            },
        },
        customization: {
            visual: {
                theme: 'dark', // Tema escuro para combinar com o site
                font: 'Inter'
            },
            paymentMethods: {
                maxInstallments: 1,
                types: {
                    excluded: ['ticket', 'bank_transfer']
                }
            }
        },
        callbacks: {
            onReady: () => {
                console.log('✅ Mercado Pago Brick Pronto!');
            },
            onSubmit: (formData) => {
                console.log('📤 Enviando dados para o servidor...');
                return new Promise((resolve, reject) => {
                    fetch("/api/mercadopago/pagar", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...formData, plano: planoAtual }),
                    })
                    .then(r => r.json())
                    .then(res => {
                        if (res.sucesso && res.status === 'approved') {
                            console.log('🎉 Pagamento Aprovado!');
                            document.getElementById('conteudo-cartao').classList.add('hidden');
                            document.getElementById('conteudo-sucesso').classList.remove('hidden');
                            resolve();
                        } else {
                            console.warn('❌ Pagamento recusado:', res);
                            alert('Cartão recusado. Por favor, tente outro cartão.');
                            reject();
                        }
                    }).catch(e => { 
                        console.error('❌ Erro na chamada de pagamento:', e);
                        alert('Erro de conexão.'); 
                        reject(); 
                    });
                });
            },
            onError: (e) => {
                console.error('❌ Erro no Brick:', e);
            }
        },
    };
    
    try {
        cardPaymentBrickController = await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', settings);
        console.log('✨ Brick criado com sucesso!');
    } catch (e) {
        console.error('❌ Falha ao criar o Brick:', e);
    }
}


function fecharModal() {
    document.getElementById('modal-pagamento').classList.add('hidden');
    document.body.style.overflow = 'auto';
    if (cardPaymentBrickController) {
        cardPaymentBrickController.unmount();
        cardPaymentBrickController = null;
    }
}

function voltarParaSelecao() {
    document.getElementById('conteudo-pix').classList.add('hidden');
    document.getElementById('conteudo-cartao').classList.add('hidden');
    document.getElementById('step-selecao').classList.remove('hidden');
}

async function gerarPix(preco, duracao) {
    const p = document.getElementById('pix-payload-text'), q = document.getElementById('pix-qr-image');
    p.innerText = '⏳ Gerando PIX...';
    try {
        const r = await fetch('/api/pix/criar', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ valor: preco, plano: duracao, email: emailAtual }) 
        });
        const d = await r.json();
        if (d.sucesso && (d.qrCodeUrl || d.codigoCopiaECola)) {
            p.innerText = d.codigoCopiaECola;
            q.src = d.qrCodeUrl ? (d.qrCodeUrl.startsWith('data:') ? d.qrCodeUrl : `data:image/png;base64,${d.qrCodeUrl}`) : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${d.codigoCopiaECola}`;
        } else { p.innerText = '❌ Erro ao gerar.'; }
    } catch (e) { p.innerText = '❌ Erro de conexão.'; }
}

function copiarPix() {
    const t = document.getElementById('pix-payload-text').innerText;
    if (t.includes('⏳')) return;
    navigator.clipboard.writeText(t).then(() => alert('PIX copiado!'));
}

async function acaoPosPayment() {
    if (planoAtual === 'Ligar para Milly') {
        window.location.href = 'https://wa.me/' + WHATSAPP_NUMBER;
        return;
    }
    const btn = document.getElementById('btn-pos-pagamento');
    btn.disabled = true;
    btn.innerText = '⌛ Gerando link...';
    try {
        const r = await fetch('/api/vips/resgatar-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailAtual })
        });
        const d = await r.json();
        if (d.sucesso) {
            window.open(d.link, '_blank');
            btn.innerText = 'Entrar no Telegram';
            btn.onclick = () => window.open(d.link, '_blank');
            btn.disabled = false;
        } else {
            alert(d.erro || 'Erro ao resgatar link.');
            btn.disabled = false;
        }
    } catch (e) { alert('Erro de conexão.'); btn.disabled = false; }
}

// Timer
(function() {
    const target = Date.now() + 14400000; // 4h
    setInterval(() => {
        const diff = target - Date.now();
        const el = document.getElementById('countdown-timer');
        if (!el || diff <= 0) return;
        const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        el.textContent = `${h}h ${m}m ${s}s`;
    }, 1000);
})();

document.getElementById('modal-pagamento').addEventListener('click', function(e) { if (e.target === this) fecharModal(); });
