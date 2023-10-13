# Use the official Node.js image as the base image
ARG NODE_VERSION=18.18

FROM node:${NODE_VERSION}-alpine as builder

WORKDIR /app

COPY package*.json ./

COPY *.json ./

COPY ./src src

RUN npm install
RUN npm run build
RUN npm run jwt
RUN ls -la

FROM node:${NODE_VERSION}-alpine as production
WORKDIR /app
ENV NODE_ENV production

COPY package*.json ./
COPY --chown=node:node --from=builder /app/dist /app/dist
COPY --chown=node:node --from=builder /app/node_modules /app/node_modules

USER node

EXPOSE 5000
CMD ["node", "/app/dist/src/main.js"]
