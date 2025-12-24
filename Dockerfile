# Build stage
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for any build steps)
RUN npm install

# Copy source code
COPY . .

# Optimization: If there were an asset build step (like tailwind or minification), it would go here.
# For now, we assume assets are already optimized or served raw.

# Final stage
FROM node:20-slim

# Install security updates
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy built artifacts and production dependencies from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app .

# Create persistent storage directories
RUN mkdir -p uploads/blog

# Security: Set permissions
RUN chown -R node:node /usr/src/app

# Set non-root user
USER node

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
