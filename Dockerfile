# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim

ENV EXPO_NO_TELEMETRY=1

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .

EXPOSE 8081

CMD ["npx", "expo", "start", "--lan", "--port", "8081"]
