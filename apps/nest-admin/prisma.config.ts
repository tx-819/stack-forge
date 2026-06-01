// 让 prisma CLI 与 Nest 的 ConfigModule 用同一套 env 加载顺序：
//   .env.<NODE_ENV>  ->  .env （后者只补全前者未设置的变量）
// dotenv 默认不会覆盖已存在的环境变量。
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv({ path: '.env', quiet: true });

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: `mysql://${process.env.MYSQL_USER}:${process.env.MYSQL_PASSWORD}@${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT}/${process.env.MYSQL_DATABASE}`,
    },
});
