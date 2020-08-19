FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --dev

COPY . .

EXPOSE 6969

CMD [ "npm", "run", "server" ]