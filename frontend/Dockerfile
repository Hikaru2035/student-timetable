#https://blog.devops.dev/how-to-dockerize-a-react-application-with-node-js-postgres-and-nginx-1af3ebaa4bf5

FROM node:20-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

