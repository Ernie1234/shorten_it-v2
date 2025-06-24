import swaggerJsdoc from 'swagger-jsdoc';
import YAML from 'yamljs';
import path from 'path';

// Load OpenAPI (Swagger) definition from a YAML file
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'swagger.yaml'));

const options = {
  definition: swaggerDocument, // Use the loaded YAML definition directly
  apis: [], // Required by swagger-jsdoc, even when using 'definition'
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
