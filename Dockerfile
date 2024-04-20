FROM oven/bun:1.1 AS base

# install libreoffice server for converting docx to pdf
RUN apt-get update && apt-get install -y libreoffice

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN bun install

# Bundle app source
COPY . .

EXPOSE 8080


CMD [ "bun", "start" ]