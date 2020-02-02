FROM node AS build
WORKDIR /var/www/frontend
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci
COPY public public
COPY src src
COPY babel.config.js babel.config.js
COPY vue.config.js vue.config.js
RUN npm run build

FROM nginx:1.12.2 AS final
WORKDIR /usr/share/nginx/html
COPY install/nginx.conf nginx.conf
RUN rm /etc/nginx/conf.d/default.conf
RUN cp nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /var/www/frontend/dist .
EXPOSE 80
