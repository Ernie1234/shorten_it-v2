import swaggerJsdoc from 'swagger-jsdoc';
import YAML from 'yamljs';
import path from 'path';

// Define the root OpenAPI configuration for the API Gateway
const gatewayDefinition = YAML.load(path.join(__dirname, '..', 'swagger.yaml'));

const options = {
  definition: gatewayDefinition,
  apis: [], // Required by swagger-jsdoc, even when using 'definition'
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
