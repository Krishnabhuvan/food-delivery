FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
RUN npm ci
RUN npx prisma generate
COPY src ./src
RUN npm run build
RUN ls -la dist/ || echo "dist is empty"
RUN cp -r src/generated dist/generated
EXPOSE 4002
CMD ["node", "dist/index.js"]