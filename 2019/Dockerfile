FROM ubuntu:19.10

#RUN apt-get update \
#  && apt-get install -y python3-pip python3-dev \
#  && cd /usr/local/bin \
#  && ln -s /usr/bin/python3 python \
#  && pip3 install --upgrade pip
#RUN pip3 install python-telegram-bot

RUN apt-get update
RUN apt-get install -y ca-certificates
RUN update-ca-certificates

COPY ./dist/main /software

CMD ["/software/main"]
