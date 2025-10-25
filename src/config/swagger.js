const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger API Documentation Configuration
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Food Search API',
      version: '1.0.0',
      description: 'RESTful API for employee meal selection and management system. This API allows employees to view available meal options, make selections, write reviews, and search for colleague orders.',
      contact: {
        name: 'API Support',
        email: 'support@devhub.tech'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.foodsearch.example.com',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management'
      },
      {
        name: 'Users',
        description: 'User account management'
      },
      {
        name: 'Meal Options',
        description: 'Available meal options management (Admin)'
      },
      {
        name: 'Meal Selections',
        description: 'Employee meal selection and ordering'
      },
      {
        name: 'Meal Reviews',
        description: 'Meal rating and review system'
      },
      {
        name: 'Search',
        description: 'Search for colleague meal selections'
      },
      {
        name: 'Admin',
        description: 'Administrative functions and data management'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'User ID' },
            email: { type: 'string', format: 'email', description: 'User email' },
            is_admin: { type: 'boolean', description: 'Admin status' },
            employee_name: { type: 'string', description: 'Employee name' },
            is_active: { type: 'boolean', description: 'Account active status' }
          }
        },
        MealOption: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            week_start_date: { type: 'string', format: 'date' },
            category: { type: 'string', description: 'Meal category (e.g., Meniu 1, Salată)' },
            monday: { type: 'string' },
            tuesday: { type: 'string' },
            wednesday: { type: 'string' },
            thursday: { type: 'string' },
            friday: { type: 'string' },
            period: { type: 'string', description: 'Week period (e.g., 20-24)' },
            source_file: { type: 'string', description: 'Source Excel filename' }
          }
        },
        MealSelection: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            week_start_date: { type: 'string', format: 'date' },
            monday: { type: 'string' },
            tuesday: { type: 'string' },
            wednesday: { type: 'string' },
            thursday: { type: 'string' },
            friday: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        MealReview: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            meal_name: { type: 'string' },
            review_text: { type: 'string', maxLength: 500 },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            week_start_date: { type: 'string', format: 'date' },
            day_of_week: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
