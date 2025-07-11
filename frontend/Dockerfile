# Dockerfile for static frontend
# Place this file at frontend/Dockerfile

FROM nginx:alpine

ENV BASE_API_URL="http://localhost:8000/api"

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy all frontend static files
COPY . /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose HTTP port
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]