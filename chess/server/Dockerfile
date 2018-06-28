FROM ubuntu

RUN apt-get update
RUN apt-get install -y nodejs npm git stockfish
RUN mv /usr/games/stockfish /usr/bin/

WORKDIR /usr/src/app

COPY lightsquared/package*.json ./
RUN npm install

COPY lightsquared .

EXPOSE 50001

CMD js main.js
