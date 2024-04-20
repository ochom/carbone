# Carbone JS

## To run app

Install libre office using the command below

```sh
sudo apt-get update && apt-get install -y libreoffice
```

## Download the image, build and run

Download the image

```sh
docker pull ochom/carbone:latest
docker run -d -p 5001:8080 ochom/carbone:latest
```

Or uring docker compose

```sh
docker compose up -d
```
