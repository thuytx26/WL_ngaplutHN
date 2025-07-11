#!/bin/sh

# Replace API_URL in your file
sed -i "s|BASE_API_URL: \".*\"|BASE_API_URL: \"${BASE_API_URL}\"|" /usr/share/nginx/html/index.html

# Tiếp tục chạy Nginx hoặc app
exec "$@"