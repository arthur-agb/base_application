# backend/Dockerfile
FROM node:22
WORKDIR /app
COPY package*.json ./
# This single command is sufficient for installing dependencies in production
RUN npm ci
COPY . . 
# Copy all code, including prisma, after installing dependencies
EXPOSE 5000
CMD ["npm", "start"]