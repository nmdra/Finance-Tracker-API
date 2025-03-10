FROM node:22-alpine3.20 AS base

# Development image

FROM base AS development

WORKDIR /app

COPY package*.json ./

RUN npm install -g nodemon && npm install --verbose

COPY ./src .

# Expose port for development
EXPOSE 5000

# Start application in watch mode for development
CMD ["npm", "run", "dev"]

# Production image

# Builder Stage
FROM base AS builder

WORKDIR /app

COPY package*.json ./

# Install only production dependencies (omit devDependencies)
RUN npm install --only=production --verbose

COPY ./src .

FROM cgr.dev/chainguard/node:latest AS production

LABEL org.opencontainers.image.title="finapi"
LABEL org.opencontainers.image.description="Financial Tracker API."
LABEL org.opencontainers.image.authors="Nimendra <nimendraonline@gmail.com>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/nmdra/Finance-Tracker-API"

ENV NODE_ENV=production

WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app .

EXPOSE 5000

# Start the application
CMD ["node", "server.js"]