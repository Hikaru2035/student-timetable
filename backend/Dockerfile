FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
