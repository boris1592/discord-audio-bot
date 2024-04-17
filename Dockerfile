FROM node:20-alpine

WORKDIR /bot
COPY . .

RUN apk update && apk upgrade && apk add --no-cache ffmpeg python3
RUN npm install
RUN npm run build

CMD ["npm", "run", "deploy"]
