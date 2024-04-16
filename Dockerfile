FROM node:20-alpine

WORKDIR /bot
COPY . .

RUN apk update && apk upgrade && apk add --no-cache ffmpeg python3
RUN npm install

CMD ["npm", "run", "start:dev"]
