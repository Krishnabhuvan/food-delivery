FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build
RUN cp -r src/generated dist/generated
EXPOSE 4004
CMD ["node", "dist/index.js"]