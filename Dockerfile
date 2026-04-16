# Stage 1: Build the React frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the Express server
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=build-frontend /app/dist ./dist
COPY --from=build-frontend /app/server.ts ./
# Note: In production, we'd typically compile server.ts to JS, 
# but for simplicity in this environment we'll use tsx or similar if needed,
# or assume the user will compile it. 
# For a standard production Dockerfile, we'll assume it's compiled or run via tsx.
RUN npm install -g tsx

EXPOSE 3000
ENV NODE_ENV=production
CMD ["tsx", "server.ts"]
