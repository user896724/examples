FROM ubuntu

RUN apt-get update
RUN apt-get install -y mongodb-server
RUN mkdir -p /data/db

EXPOSE 27017

CMD mongod --bind_ip 0.0.0.0
