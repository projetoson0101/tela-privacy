# ══════════════════════════════════════════════════════════
# Privacy SaaS — Dockerfile otimizado para Railway
# Multi-stage build para imagem menor e mais segura
# ══════════════════════════════════════════════════════════

# Stage 1: Instalar dependências
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production --ignore-scripts && npm cache clean --force

# Stage 2: Copiar app e rodar
FROM node:20-alpine
WORKDIR /app

# Segurança: rodar como non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Remover arquivos desnecessários do container
RUN rm -f .env docker-compose.yml .hintrc

# Permissão para gravar no fallback data.json
RUN chown -R appuser:appgroup /app

ENV NODE_ENV=production

# Railway injeta PORT via env var
# EXPOSE 3000

# Healthcheck para Railway (usando porta dinâmica)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:${PORT:-3000}/api/health || exit 1

USER appuser

CMD ["npm", "start"]
