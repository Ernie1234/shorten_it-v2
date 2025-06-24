// apps/url-service/src/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";

export default swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "URL Service API",
      version: "1.0.0",
      description: "API documentation for the URL Shortening Service",
    },
    servers: [
      {
        url: "http://localhost:5002/api/urls",
        description: "URL Service Local",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Scans route files for JSDoc comments
});
