FROM node:22-alpine AS builder

WORKDIR /build

COPY package.json tsconfig.json ./
COPY src/ src/

RUN npm ci && \
    npm run build


FROM node:22-alpine AS runner

RUN addgroup -S rodiumai && \
    adduser -S -G rodiumai rodiumai

WORKDIR /app

COPY --from=builder /build/dist/ dist/
COPY --from=builder /build/package.json .

RUN npm ci --omit=dev && \
    rm -rf /root/.npm /root/.cache

USER rodiumai

ENTRYPOINT ["node", "-e", "const r = require('./dist/index.js'); console.log('RodiumAI SDK v' + r.VERSION);"]
