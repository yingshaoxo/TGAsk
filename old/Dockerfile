FROM ubuntu:18.04

ENV LANG C.UTF-8

RUN apt-get update
RUN apt-get install -y sudo
RUN apt-get install -y python3
RUN apt-get install -y python3-pip
RUN apt-get install -y python3-dev

COPY ./requirements.txt /data/requirements.txt
RUN pip3 install --no-cache-dir -r /data/requirements.txt

COPY . /data/

CMD ["python3", "/data/main.py"]
