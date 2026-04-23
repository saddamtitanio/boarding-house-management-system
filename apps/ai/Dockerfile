# Use lightweight Node.js image
FROM node:lts-alpine

# Set working directory
WORKDIR /src

COPY package*.json ./

RUN npm install

COPY . .

# Expose the service port
EXPOSE 8000

# Start the AI service
CMD ["npm", "run", "dev"]