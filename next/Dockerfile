FROM node:22-alpine

WORKDIR /app

# 빌드에 필요한 도구들 설치
RUN apk add --no-cache libc6-compat

COPY package*.json ./

# 전체 의존성 설치 (빌드를 위해)
RUN npm ci

COPY . .

# Prisma 생성
RUN npx prisma generate

# Next.js 빌드
RUN npm run build

# production 의존성만 재설치 (최적화)
RUN npm ci --only=production && npm cache clean --force

EXPOSE 3000

CMD ["npm", "start"]