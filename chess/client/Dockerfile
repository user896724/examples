FROM ubuntu

RUN apt-get update

RUN apt-get install -y apache2
RUN a2enmod rewrite

RUN apt-get install -y nodejs npm
RUN npm i -g requirejs

WORKDIR /usr/src/app

COPY lightsquare .

RUN r.js -o build.js
RUN chown -R www-data ../lightsquare-optimised

ADD apache2.conf /etc/apache2/
ADD apache-vhost.conf /etc/apache2/sites-enabled/000-default.conf

EXPOSE 80

ENV APACHE_RUN_USER www-data
ENV APACHE_RUN_GROUP www-data
ENV APACHE_LOG_DIR /var/log/apache2
ENV APACHE_LOCK_DIR /var/lock/apache2
ENV APACHE_PID_FILE /var/run/apache2.pid

CMD /usr/sbin/apache2ctl -D FOREGROUND
