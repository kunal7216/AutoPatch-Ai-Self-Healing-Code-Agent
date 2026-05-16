FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install

COPY . .
ENV VITE_API_BASE_URL=http://localhost:8000
ENV VITE_ENABLE_DEMO_MODE=true
ENV VITE_ENABLE_WEBSOCKET=true
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
