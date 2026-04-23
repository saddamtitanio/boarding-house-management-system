FROM node:lts-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /src/app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /src/app
COPY --from=deps /src/app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /src/app
ENV NODE_ENV=production

COPY --from=builder /src/app/.next/standalone ./
COPY --from=builder /src/app/.next/static ./.next/static
COPY --from=builder /src/app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]