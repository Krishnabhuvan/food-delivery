FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
RUN npm ci
RUN npx prisma generate
COPY src ./src
EXPOSE 4003
CMD ["npx", "ts-node", "src/index.ts"]