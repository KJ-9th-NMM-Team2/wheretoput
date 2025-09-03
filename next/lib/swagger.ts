import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My Next.js API",
      version: "1.0.0",
      description: "API documentation for my Next.js application",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://myapp.vercel.app"
            : "http://localhost:3000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
  },
  apis: ["./app/api/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
