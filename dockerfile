# Stage 1: Build the application

# --- Use a different base image ---
# Switch from -alpine to -slim, which might be more stable under emulation
# Explicitly request the amd64 platform for the base image
FROM --platform=linux/amd64 node:22-slim AS builder

LABEL maintainer="chekuhakim"

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
# --- Add --ignore-scripts to prevent postinstall crashes under emulation ---
RUN npm install --ignore-scripts

# Copy the rest of the application source code
COPY . .

# --- Update Browserslist (Address build warning) ---
# RUN npx update-browserslist-db@latest --accept-licenses # May need --accept-licenses depending on npx version

# Build the React app for production
# --- Increase Node memory limit during build ---
# --- Disable minification as a workaround for emulation instability ---
# Note: The extra '--' passes the flag through npm to the 'vite build' script
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build -- --minify false

# Stage 2: Serve the built application
# --- Use the same base image type for consistency ---
FROM --platform=linux/amd64 node:22-slim

WORKDIR /app

# Install 'serve' to statically serve the built files
RUN npm install -g serve

# Copy only the built artifacts from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Expose the port 'serve' will run on
EXPOSE 3000

# Command to run the server
CMD ["serve", "-s", "dist", "-l", "3000"]

