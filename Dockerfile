FROM node:20-alpine

WORKDIR /bot
COPY . .

RUN yarn install --production=true

CMD ["node", "src/index"]