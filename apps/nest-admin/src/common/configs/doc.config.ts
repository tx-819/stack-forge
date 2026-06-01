import { registerAs } from '@nestjs/config';

export default registerAs('doc', () => ({
    name: `${process.env.APP_NAME} APIs Specification`,
    description: 'API Description',
    version: '1.0',
    prefix: '/docs',
}));
