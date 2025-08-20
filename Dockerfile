FROM node:20-alpine
# sqlite CLI בשביל אתחול DB מה-compose (אם צריך)
RUN apk add --no-cache sqlite
WORKDIR /app

# תלויות
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# קוד
COPY . .

# Build ל-Next (אם אין סקריפט build – נדלג)
RUN npm run build || echo "No build script, skipping"

ENV NODE_ENV=production
EXPOSE 3000 3001

# ברירת מחדל; ה-compose יחליף את ה-Command לכל שירות
CMD ["node","server.js"]
