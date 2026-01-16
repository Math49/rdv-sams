# ---- Front build (Vite) ----
FROM node:22-alpine AS frontend
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build


# ---- PHP deps (Composer) ----
FROM composer:2 AS vendor
WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress

COPY . .
RUN composer dump-autoload --optimize


# ---- Runtime (PHP 8.4) ----
FROM php:8.4-cli-alpine

WORKDIR /var/www/html

RUN apk add --no-cache \
    bash icu-dev oniguruma-dev libzip-dev zip unzip \
    freetype-dev libjpeg-turbo-dev libpng-dev \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j"$(nproc)" pdo_mysql mbstring intl zip gd opcache

# App + vendor
COPY --from=vendor /app /var/www/html

# Assets Vite build -> public/build
COPY --from=frontend /app/public/build /var/www/html/public/build

# Permissions Laravel
RUN addgroup -g 1000 app && adduser -G app -g app -s /bin/sh -D -u 1000 app \
  && chown -R app:app /var/www/html \
  && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

USER app

EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
