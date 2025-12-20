# Use official Node.js image
FROM node:20-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY package*.json ./

# Install dependencies.
RUN npm install --production

# Copy local code to the container image.
COPY . .

# Ensure the uploads directory exists within the container
RUN mkdir -p uploads

# Bind the app to port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Run the web service on container startup.
CMD [ "npm", "start" ]
