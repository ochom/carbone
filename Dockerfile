FROM node:16-buster-slim

# install libreoffice server for converting docx to pdf
RUN apt-get update && apt-get install -y libreoffice


# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN npm install

RUN npm install -g nodemon

# Bundle app source
COPY . .

EXPOSE 8080


CMD [ "npm", "start" ]