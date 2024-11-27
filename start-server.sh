#!/bin/bash

npm i -g yarn
yarn install
yarn build
yarn db-migrate up
yarn start
