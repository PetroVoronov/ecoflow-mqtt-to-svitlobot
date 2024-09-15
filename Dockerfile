FROM node:22-alpine

# Copy across the files from our `intermediate` container
RUN mkdir app

COPY ../src /app/src

COPY ../package*.json /app

WORKDIR /app

RUN mkdir config

RUN npm install -g npm@latest \
    && npm ci --omit=dev

CMD [ "node", "src/index.js"]