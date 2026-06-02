FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
RUN npm ci
RUN npx prisma generate
COPY src ./src
RUN npx tsc
RUN cp -r src/generated dist/src/generated
EXPOSE 4004
CMD ["node", "dist/src/index.js"]
