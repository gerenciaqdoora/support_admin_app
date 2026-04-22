# ---------- BASE ----------
FROM node:24 AS base
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install -g @angular/cli@21 \
    && npm ci --legacy-peer-deps

COPY . .

# ---------- DEV ----------
FROM base AS dev
EXPOSE 4203
CMD ["npm", "start"]

# ---------- BUILD (QA / PROD) ----------
FROM base AS build
ARG BUILD_ENV=production
RUN npm run build -- --configuration=${BUILD_ENV}

# ---------- RUNTIME ----------
FROM nginx:alpine AS runtime

COPY --from=build /usr/src/app/dist/support-portal/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
