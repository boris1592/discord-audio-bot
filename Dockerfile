FROM node:20-alpine

WORKDIR /bot
COPY . .

RUN yarn install

CMD ["/bin/sh", "-c", "node src/index | yarn pino-pretty"]
