FROM ubuntu

RUN apt-get update
RUN apt-get install -y nodejs npm

WORKDIR /usr/src/app

COPY . .

CMD js fetch-json.js
