# Use a Node.js base image
FROM node:latest

# Set the working directory
WORKDIR /app

# Install necessary dependencies
COPY package*.json ./
RUN npm install

# Copy the application code into the container
COPY . .

# Expose the necessary port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
