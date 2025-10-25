# Food Search API

A comprehensive RESTful API for employee meal selection and management system. This backend service allows employees to view available meal options, make selections, write reviews, and search for colleague orders.

## Features

- **Authentication & Authorization**: Secure session-based authentication with role-based access control
- **Meal Options Management**: Admin can upload weekly meal options via Excel files
- **Meal Selection**: Employees can select their preferred meals for each week
- **Review System**: Rate and review meals with a 5-star rating system
- **Search Functionality**: Search for colleagues' meal selections
- **Admin Dashboard**: Statistics, exports, and data management
- **Email Notifications**: Automated email notifications when new meal options are available
- **Comprehensive API Documentation**: Interactive Swagger/OpenAPI documentation

## Tech Stack

- **Runtime**: Node.js (>= 18.x)
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: Express Session with bcrypt
- **File Upload**: Multer
- **Excel Processing**: xlsx
- **Email**: Nodemailer
- **API Documentation**: Swagger UI Express & swagger-jsdoc

## Project Structure

```
food-search-api/
├── src/
│   ├── config/             # Configuration files
│   │   ├── database.js     # Database connection and setup
│   │   ├── email.js        # Email service configuration
│   │   └── swagger.js      # Swagger/OpenAPI configuration
│   ├── controllers/        # Request handlers
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── mealOptions.controller.js
│   │   ├── mealSelections.controller.js
│   │   ├── reviews.controller.js
│   │   ├── search.controller.js
│   │   └── users.controller.js
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js         # Authentication middleware
│   │   ├── errorHandler.js # Error handling middleware
│   │   └── upload.js       # File upload middleware
│   ├── routes/            # API routes
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── mealOptions.routes.js
│   │   ├── mealSelections.routes.js
│   │   ├── reviews.routes.js
│   │   ├── search.routes.js
│   │   └── users.routes.js
│   ├── services/          # Business logic
│   │   └── database.service.js
│   ├── utils/             # Utility functions
│   │   └── validators.js
│   └── server.js          # Application entry point
├── uploads/               # Upload directory for Excel files
├── .env.example          # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd food-search-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your-secret-key-here
   DATABASE_PATH=./food-search.db

   # Email Configuration (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=Food Search <noreply@devhub.tech>
   APP_URL=http://localhost:3000

   # Allowed Email Domains
   ALLOWED_EMAIL_DOMAINS=@devhub.tech,@titans.net,@solidstake.com
   ```

4. **Start the server**:
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

5. **Access the API**:
   - API: http://localhost:3000
   - Documentation: http://localhost:3000/api-docs
   - Health Check: http://localhost:3000/health

## Default Admin Credentials

The system automatically creates a default admin user on first run:

- **Email**: `sergiu.tigan@devhub.tech`
- **Password**: `marian93A@`

**Important**: Change these credentials after first login in production!

## API Documentation

### Interactive Documentation

Visit http://localhost:3000/api-docs for the complete interactive Swagger UI documentation where you can:
- View all available endpoints
- See request/response schemas
- Test API endpoints directly from the browser
- Understand authentication requirements

### API Endpoints Overview

#### Authentication (`/api/auth`)
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

#### Users (`/api/users`)
- `GET /api/users/employees` - Get employee names from menu
- `POST /api/users/me/employee-name` - Set employee name
- `GET /api/users/employees/names` - Get all employee names (autocomplete)
- `POST /api/users` - Create user (Admin)
- `GET /api/users` - Get all users (Admin)

#### Meal Options (`/api/meal-options`)
- `POST /api/meal-options/upload` - Upload meal options Excel (Admin)
- `GET /api/meal-options` - Get meal options for a week

#### Meal Selections (`/api/meal-selections`)
- `POST /api/meal-selections` - Save meal selection
- `GET /api/meal-selections/me` - Get current user's selection
- `GET /api/meal-selections/history` - Get user's selection history
- `GET /api/meal-selections/all` - Get all selections (Admin)
- `POST /api/meal-selections/import` - Import selections from Excel (Admin)
- `GET /api/meal-selections/statistics` - Get statistics (Admin)
- `GET /api/meal-selections/statistics/export` - Export statistics to Excel (Admin)
- `GET /api/meal-selections/export` - Export selections to Excel (Admin)

#### Reviews (`/api/reviews`)
- `POST /api/reviews` - Save/update meal review
- `GET /api/reviews` - Get all reviews for a meal
- `GET /api/reviews/my-review` - Get current user's review for a meal
- `GET /api/reviews/my-reviews` - Get all reviews by current user
- `GET /api/reviews/recent` - Get recent reviews for a meal

#### Search (`/api/search`)
- `GET /api/search/weeks` - Get available weeks
- `GET /api/search/meals` - Get meals for a week
- `GET /api/search` - Search for colleague's meals by name

#### Admin (`/api/admin`)
- `GET /api/admin/weeks` - Get all available weeks
- `DELETE /api/admin/weeks/:weekStartDate` - Delete week data

## Authentication

The API uses session-based authentication with HTTP-only cookies.

### Login Flow

1. **Register** (if new user):
   ```bash
   POST /api/auth/register
   {
     "email": "john.doe@devhub.tech",
     "password": "password123"
   }
   ```

2. **Login**:
   ```bash
   POST /api/auth/login
   {
     "email": "john.doe@devhub.tech",
     "password": "password123"
   }
   ```

   Response includes a session cookie that's automatically sent with subsequent requests.

3. **Access Protected Routes**: Session cookie is included automatically in requests.

4. **Logout**:
   ```bash
   POST /api/auth/logout
   ```

### Email Domain Restrictions

Only emails from allowed domains can register:
- `@devhub.tech`
- `@titans.net`
- `@solidstake.com`

Configure additional domains in `.env` via `ALLOWED_EMAIL_DOMAINS`.

## Usage Examples

### Upload Meal Options (Admin)

```bash
curl -X POST http://localhost:3000/api/meal-options/upload \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -F "file=@meal-options.xlsx"
```

### Get Meal Options

```bash
curl -X GET http://localhost:3000/api/meal-options \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

### Save Meal Selection

```bash
curl -X POST http://localhost:3000/api/meal-selections \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "week_start_date": "2024-11-20",
    "monday": "Meniu 1 | Salată verde | Extra soup",
    "tuesday": "Meniu 2 | Salată roșii",
    "wednesday": "Meniu 1",
    "thursday": "Special Fish",
    "friday": "Meniu 3 | Salată mix"
  }'
```

### Write a Meal Review

```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "mealName": "Ciorbă de burtă",
    "reviewText": "Very tasty and authentic!",
    "rating": 5,
    "weekStartDate": "2024-11-20",
    "dayOfWeek": "monday"
  }'
```

### Search for Colleague's Meals

```bash
curl -X GET "http://localhost:3000/api/search?name=John" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"
```

## Excel File Formats

### Meal Options Excel Format

The Excel file should have a sheet named "Sheet1" with:
- Column A: (blank/category marker)
- Column B: Monday
- Column C: Tuesday
- Column D: Wednesday
- Column E: Thursday
- Column F: Friday

Categories are detected when all day columns have the same value (e.g., "Meniu 1", "Salată", "Extra").

Example:
```
|          | Monday          | Tuesday         | Wednesday       | Thursday        | Friday          |
|----------|----------------|----------------|----------------|----------------|----------------|
| Meniu 1  | Meniu 1        | Meniu 1        | Meniu 1        | Meniu 1        | Meniu 1        |
|          | Ciorbă         | Supă           | Borș           | Ciorbă         | Supă           |
|          | Pui cu orez    | Paste          | Mămăligă       | Cartofi        | Pui            |
| Salată   | Salată         | Salată         | Salată         | Salată         | Salată         |
|          | Verde          | Roșii          | Mix            | Varză          | Castraveți     |
```

### Meal Selections Import Excel Format

For importing meal selections:
- Column A: Employee Name
- Column B: Division/Floor (optional)
- Column C: Monday
- Column D: Tuesday
- Column E: Wednesday
- Column F: Thursday
- Column G: Friday

## Email Notifications

When meal options are uploaded, the system automatically sends email notifications to all registered users.

To enable email notifications:
1. Configure SMTP settings in `.env`
2. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)
3. Test with: The system tests email configuration on startup

## Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts and authentication
- **meal_options**: Available meal options by week
- **meal_selections**: User meal selections
- **meals**: Imported meal data
- **meal_reviews**: Meal ratings and reviews
- **upload_history**: Track uploaded files to prevent duplicates

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- HTTP-only cookies
- CSRF protection via SameSite cookies
- Email domain validation
- File upload restrictions (Excel files only, 10MB max)
- Duplicate upload prevention
- Role-based access control (Admin/User)

## Development

### Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests (to be implemented)
npm test
```

### Adding New Routes

1. Create controller in `src/controllers/`
2. Create route file in `src/routes/`
3. Add Swagger documentation using JSDoc comments
4. Register route in `src/server.js`

Example:
```javascript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/your-endpoint', yourController.yourMethod);
```

## Error Handling

The API uses consistent error responses:

```json
{
  "error": "Error message description"
}
```

HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `SESSION_SECRET` | Session encryption key | `food-search-secret-key-2024` |
| `DATABASE_PATH` | SQLite database file path | `./food-search.db` |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_USER` | SMTP username | - |
| `EMAIL_PASSWORD` | SMTP password | - |
| `EMAIL_FROM` | Email sender address | `Food Search <noreply@devhub.tech>` |
| `APP_URL` | Application URL for emails | `http://localhost:3000` |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated allowed domains | `@devhub.tech,@titans.net,@solidstake.com` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

## Production Deployment

1. Set environment variables:
   ```bash
   export NODE_ENV=production
   export SESSION_SECRET=your-secure-secret
   ```

2. Use a process manager (PM2):
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name food-search-api
   pm2 startup
   pm2 save
   ```

3. Use a reverse proxy (nginx) for HTTPS
4. Set up database backups
5. Configure log rotation
6. Set up monitoring and alerts

## License

MIT

## Support

For issues, questions, or contributions, please contact the development team or create an issue in the project repository.

## Changelog

### Version 1.0.0 (Initial Release)
- Complete RESTful API implementation
- User authentication and authorization
- Meal options management
- Meal selection functionality
- Review system
- Search functionality
- Admin dashboard features
- Comprehensive Swagger documentation
- Email notification system
- Excel import/export functionality
