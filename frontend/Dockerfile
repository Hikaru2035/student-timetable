#https://blog.devops.dev/how-to-dockerize-a-react-application-with-node-js-postgres-and-nginx-1af3ebaa4bf5

FROM node:20-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host"]
