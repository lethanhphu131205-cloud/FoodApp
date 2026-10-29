FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY models ./models
COPY server.js ./

ENV NODE_ENV=production

EXPOSE 5000

CMD ["npm", "start"]