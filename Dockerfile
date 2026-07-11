# Immagine minimale solo per il server WebSocket (deploy cloud / VPS)
FROM node:20-alpine
WORKDIR /app
COPY server/package.json ./
RUN npm install --omit=dev
COPY server/index.mjs ./
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV HOST=0.0.0.0
# Railway/Render/Fly impostano PORT automaticamente
EXPOSE 3847
CMD ["node", "index.mjs"]
