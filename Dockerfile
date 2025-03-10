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

# Switch to a distroless image
# FROM gcr.io/distroless/nodejs22-debian12 AS distroless
FROM node:22-alpine3.20 AS production 

LABEL org.opencontainers.image.title="finapi"
LABEL org.opencontainers.image.description="Financial Tracker API."
LABEL org.opencontainers.image.authors="Nimendra <nimendraonline@gmail.com>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/nmdra/Finance-Tracker-API"

WORKDIR /app

# Copy only necessary files from the previous production image (including node_modules)
COPY --from=builder /app /app

USER nonroot

EXPOSE 5000

CMD ["server.js"]
