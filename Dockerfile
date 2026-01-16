############################
# 1️⃣ Vendor (Composer)
############################
FROM composer:2 AS vendor
WORKDIR /app

# MongoDB extension for composer platform checks
RUN apk add --no-cache $PHPIZE_DEPS openssl-dev \
  && pecl install mongodb \
  && docker-php-ext-enable mongodb \
  && apk del $PHPIZE_DEPS openssl-dev

# Copy only composer files (cache-friendly)
COPY composer.json composer.lock ./

# IMPORTANT: disable scripts (no artisan during build)
RUN composer install \
  --no-dev \
  --prefer-dist \
  --no-interaction \
  --no-progress \
  --no-scripts

# Copy the rest of the app
COPY . .


############################
# 2️⃣ Assets (Vite / Wayfinder)
############################
FROM php:8.4-cli-alpine AS assets
WORKDIR /app

RUN apk add --no-cache nodejs npm

COPY . .
COPY --from=vendor /app/vendor /app/vendor

RUN npm install
RUN npm run build


############################
# 3️⃣ Runtime
############################
FROM php:8.4-cli-alpine
WORKDIR /var/www/html

RUN apk add --no-cache \
    bash icu-dev oniguruma-dev libzip-dev zip unzip \
    freetype-dev libjpeg-turbo-dev libpng-dev \
    $PHPIZE_DEPS openssl-dev \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j"$(nproc)" mbstring intl zip gd opcache \
  && pecl install mongodb \
  && docker-php-ext-enable mongodb \
  && apk del $PHPIZE_DEPS openssl-dev

# App + vendor
COPY --from=vendor /app /var/www/html

# Built assets
COPY --from=assets /app/public/build /var/www/html/public/build

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
