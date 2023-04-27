FROM node:16-alpine

WORKDIR /app

COPY . .

RUN npm i

ENV PORT=3000

EXPOSE $PORT

CMD ["npm", "start"]