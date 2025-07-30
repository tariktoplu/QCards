FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Compile TypeScript to JavaScript
RUN npx tsc

# Expose port 4000
EXPOSE 4000

# Command to run the compiled app
CMD ["node", "dist/index.js"]