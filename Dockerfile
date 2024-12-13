# Use a Node.js base image
FROM node:22-alpine

# Create non-root user
RUN addgroup --system appgroup && \
    adduser --system appuser --ingroup appgroup

# Set the working directory
WORKDIR /app

# Install necessary dependencies
COPY package*.json ./
RUN npm i --only=production

# Copy the application code into the container
COPY . .

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose the necessary port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
