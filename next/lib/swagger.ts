import swaggerJsdoc from 'swagger-jsdoc';
import { OpenAPIV3 } from 'openapi-types';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My Next.js API',
      version: '1.0.0',
      description: 'API documentation for my Next.js application',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://myapp.vercel.app' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server',
      },
    ],
  } as OpenAPIV3.Document,
  apis: ['./pages/api/**/*.{js,ts}', './app/api/**/*.{js,ts}'],
};

const specs = swaggerJsdoc(options);
export default specs;