# 🔞 Privacy Payment Gateway - Senior Edition

Sistema profissional de checkout transparente para venda de conteúdo VIP, integrado com **Mercado Pago (Checkout Bricks)** e **PIX**.

## 🛠️ Arquitetura e Organização

O projeto foi reestruturado seguindo padrões de **Engenharia Full-Stack Sênior**, separando as responsabilidades de forma clara:

### 📂 Diretórios Principais

- **`/public`**: Contém apenas os ativos estáticos que são servidos diretamente ao navegador.
  - `index.html`: Página principal otimizada.
  - `/images`: Galeria de mídias e assets visuais.

- **`/src`**: Onde reside toda a inteligência da aplicação.
  - `app.js`: Servidor Express centralizado e limpo.
  - **`/api`**: Serviços de integração (Decoupled Services).
    - `db-service.js`: Gestão de dados (PostgreSQL/JSON Fallback).
    - `payment-service.js`: Motores de pagamento (Stripe/Mercado Pago).
    - `pix-service.js`: Gateway de PIX.
    - `telegram-service.js`: Automação de entrega via bot.
  - **`/js`**: Lógica de frontend e manipulação de SDKs (Ex: `checkout-handler.js`).

## ⚙️ Configuração (Variáveis de Ambiente)

Certifique-se de configurar o arquivo `.env` na raiz:
```env
MERCADOPAGO_PUBLIC_KEY=TEST-...
MERCADOPAGO_ACCESS_TOKEN=TEST-...
PUSHINPAY_TOKEN=...
TELEGRAM_BOT_TOKEN=...
```

## 🧪 Guia de Testes (Modo Sandbox)

Para validar o fluxo sem custos reais, utilize as credenciais de teste do Mercado Pago:
- **Cartão:** `4444 4444 4444 4444`
- **Nome:** `APRO`
- **CVV:** `123`
- **Data:** `12/28`

---
Desenvolvido com foco em alta conversão e estabilidade. 🚀
