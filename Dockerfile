FROM node:22.22.2-bookworm-slim
WORKDIR /app
COPY --chown=node:node index.html manifest.webmanifest server.js tutor-server.js portable-config.js ./
COPY --chown=node:node js ./js
COPY --chown=node:node css ./css
COPY --chown=node:node data ./data
COPY --chown=node:node icons ./icons
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8888
USER node
EXPOSE 8888
CMD ["node", "server.js"]
