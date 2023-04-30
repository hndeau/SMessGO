FROM golang

LABEL base.name="SMess"

WORKDIR /app

COPY . .

RUN go build -o smess .

EXPOSE 80

ENTRYPOINT ["./smess"]


