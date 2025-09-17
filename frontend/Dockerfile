# 直接使用已构建的前端文件
FROM nginx:alpine

# 复制已构建的前端文件
COPY build /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 3000

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
