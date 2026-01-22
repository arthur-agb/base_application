# frontend/Dockerfile
# Build image for the frontend application

FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
# This allows caching of the dependency installation step
COPY package*.json ./

# Install dependencies. Use npm ci if you have a package-lock.json for reproducible builds.
RUN npm ci || npm install

# Copy the rest of the application code
COPY . .

# Run the build command for the frontend application
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# Move the build artifacts to a separate directory effectively "baking" them into the image
# This is necessary because if we mount a volume to /app/dist, it will hide the pre-built files
# unless we copy them INTO the volume at runtime.
RUN mv dist dist_built

# Default command to run when the container starts.
# We copy the baked assets from safe storage into the mounted volume.
CMD ["sh", "-c", "rm -rf dist/* && cp -r dist_built/* dist/ && echo 'Frontend assets updated in volume.'"]
