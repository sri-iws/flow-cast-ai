FROM node:22-alpine AS frontend-build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js .
COPY src ./src
COPY styles.css theme.css app.js frontend.md ./
RUN npm run build

FROM python:3.12-slim

WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend ./
COPY --from=frontend-build /app/dist ./frontend-dist

ENV FLOW_CAST_DATABASE=/app/data/inventory.db
RUN mkdir -p /app/data

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]