FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY src ./src
EXPOSE 4005
CMD ["npx", "ts-node", "src/index.ts"]