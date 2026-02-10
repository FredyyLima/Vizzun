FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=8081

EXPOSE 8081

CMD ["npm", "run", "start:server:deploy"]
