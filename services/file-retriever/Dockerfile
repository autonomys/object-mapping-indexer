FROM node:20

WORKDIR /app

COPY . .
RUN npm install -g corepack
RUN corepack prepare yarn@4.2.2 --activate
RUN yarn install
RUN yarn build

EXPOSE 3000

CMD ["node", "--es-module-specifier-resolution=node", "dist/index.js"]
