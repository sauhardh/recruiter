FROM node:22-slim

WORKDIR /app
RUN npm install -g pnpm


COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json


RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
WORKDIR /app/apps/api

RUN pnpm exec prisma generate

EXPOSE 5000

# CMD ["pnpm dev"]
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm dev"]
