# Multi-stage Dockerfile for production deployment
FROM node:18-alpine AS builder

WORKDIR /app

# Install system dependencies for building native modules
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies)
RUN npm ci --include=dev

# Copy source code
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY .sequelizerc ./

# Build application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S slackapp -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=slackapp:nodejs /app/dist ./dist
COPY --from=builder --chown=slackapp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=slackapp:nodejs /app/package*.json ./
COPY --from=builder --chown=slackapp:nodejs /app/migrations ./migrations
COPY --from=builder --chown=slackapp:nodejs /app/.sequelizerc ./

# Create logs directory
RUN mkdir -p /app/logs && chown slackapp:nodejs /app/logs

# Switch to non-root user
USER slackapp

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command
CMD ["npm", "start"]
