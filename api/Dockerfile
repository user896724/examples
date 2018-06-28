FROM ubuntu

RUN apt-get update
RUN apt-get install -y nodejs npm
RUN npm i -g livescript

WORKDIR /usr/src/app

COPY carrier-points-api/package*.json ./
RUN npm install

COPY carrier-points-api .

EXPOSE 10003

CMD lsc main.ls
