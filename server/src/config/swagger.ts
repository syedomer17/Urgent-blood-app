import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';
import { config } from './env';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'LifeLink API Documentation',
            version,
            description: 'Real-time Geo-based Emergency Blood Matching System',
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.port}/api/v1`,
                description: 'Local Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.model.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
