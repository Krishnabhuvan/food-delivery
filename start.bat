@echo off
echo Starting Docker containers...
docker-compose up rabbitmq redis -d
timeout /t 10

echo Starting services...
start cmd /k "cd auth-service && npx ts-node-dev src/index.ts"
start cmd /k "cd restaurant-service && npx ts-node-dev src/index.ts"
start cmd /k "cd rider-service && npx ts-node-dev src/index.ts"
start cmd /k "cd admin-service && npx ts-node-dev src/index.ts"
start cmd /k "cd realtime-service && npx ts-node-dev src/index.ts"
start cmd /k "cd gateway && npx ts-node-dev src/index.ts"
start cmd /k "cd client && npm run dev"

echo All services started!