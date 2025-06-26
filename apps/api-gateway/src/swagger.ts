import swaggerJsdoc from 'swagger-jsdoc';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url'; // <-- ADD THIS IMPORT

// In ES Modules, __dirname is not directly available.
// We can derive it from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // <-- ADD THESE TWO LINES

// Define the root OpenAPI configuration for the API Gateway
// Ensure the path to swagger.yaml is correct relative to this swagger.ts file
// If swagger.yaml is in the *root* of api-gateway, and swagger.ts is in *src*, then it's '../*.yaml'
const gatewayDefinition = YAML.load(path.join(__dirname, '..', 'swagger.yaml')); // <-- This path looks correct if swagger.yaml is one level up

const options = {
  definition: gatewayDefinition,
  apis: [], // Required by swagger-jsdoc, even when using 'definition'
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
