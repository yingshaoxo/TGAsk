FROM ubuntu:19.10

COPY ./dist/main /software

CMD ["/software/main"]
