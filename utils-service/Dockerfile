FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx tsc --rootDir src --outDir dist
EXPOSE 4006
CMD ["node", "dist/index.js"]