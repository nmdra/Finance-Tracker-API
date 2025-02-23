FROM node:22-alpine3.20 AS development

WORKDIR /app

COPY package*.json ./

# Install development dependencies separately
RUN npm install -g nodemon && npm install --omit=dev --verbose

COPY . .

# Expose port for development
EXPOSE 5000

# Start application in watch mode for development
CMD ["npm", "run", "watch"]


