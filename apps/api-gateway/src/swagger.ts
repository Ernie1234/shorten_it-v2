import swaggerJsdoc from 'swagger-jsdoc';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url'; // Import fileURLToPath for ESM __dirname

// For ES Modules, derive __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the root OpenAPI configuration for the API Gateway
// This assumes swagger.yaml is located directly in apps/api-gateway/swagger.yaml
const gatewayDefinition = YAML.load(path.join(__dirname, '..', 'swagger.yaml')); // <-- path.join(__dirname, '..', 'swagger.yaml')

const options = {
  definition: gatewayDefinition,
  apis: [], // Required by swagger-jsdoc, even when using 'definition'
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
