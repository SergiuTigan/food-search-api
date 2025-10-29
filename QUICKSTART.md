# Quick Start Guide

Get the Food Search API up and running in 5 minutes!

## Prerequisites

- Node.js 18.x or higher
- npm (comes with Node.js)

## Installation & Setup

### 1. Install Dependencies

```bash
cd food-search-api
npm install
```

### 2. Configure Environment

The `.env` file is already created with default settings. To enable email notifications (optional):

```bash
# Edit .env and update these fields:
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

For Gmail, create an [App Password](https://support.google.com/accounts/answer/185833).

### 3. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

### 4. Access the Application

Once started, you'll see:

```
==================================================
🚀 Food Search API Server Running
==================================================
📍 Server URL: http://localhost:3000
📚 API Documentation: http://localhost:3000/api-docs
💚 Health Check: http://localhost:3000/health
==================================================
```

### 5. Explore the API

**Option 1: Interactive Documentation (Recommended)**

Visit http://localhost:3000/api-docs in your browser to:
- See all available endpoints
- Test API calls directly
- View request/response examples
- Understand authentication flow

**Option 2: Test with curl**

```bash
# Health check
curl http://localhost:3000/health

# Get API info
curl http://localhost:3000/

# Login with default admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sergiu.tigan@devhub.tech",
    "password": "YOUR_PASSWORD_HERE"
  }'
```

## Default Admin Account

The system automatically creates an admin account:

- **Email**: `sergiu.tigan@devhub.tech`
- **Password**: Set via ADMIN_PASSWORD in .env file

**Important**: Change these credentials in production!

## Project Structure

```
food-search-api/
├── src/
│   ├── config/         # Configuration (database, email, swagger)
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Custom middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── server.js       # Entry point
├── uploads/            # File uploads
├── .env                # Environment variables
├── package.json        # Dependencies
└── README.md          # Full documentation
```

## Common Tasks

### Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@devhub.tech",
    "password": "password123"
  }'
```

### Upload Meal Options (Admin)

Prepare an Excel file with meal options, then:

```bash
curl -X POST http://localhost:3000/api/meal-options/upload \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -F "file=@path/to/meal-options.xlsx"
```

### Select Meals

```bash
curl -X POST http://localhost:3000/api/meal-selections \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "week_start_date": "2024-11-20",
    "monday": "Meniu 1 | Salată verde",
    "tuesday": "Meniu 2",
    "wednesday": "Special Fish",
    "thursday": "Meniu 1 | Extra soup",
    "friday": "Meniu 3"
  }'
```

### Write a Review

```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "mealName": "Ciorbă de burtă",
    "reviewText": "Delicious and authentic!",
    "rating": 5,
    "weekStartDate": "2024-11-20",
    "dayOfWeek": "monday"
  }'
```

### Search for Colleague's Meal

```bash
curl -X GET "http://localhost:3000/api/search?name=John" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

## Using with Postman

1. Import the OpenAPI spec: http://localhost:3000/api-docs.json
2. All endpoints will be automatically configured
3. Use Postman's cookie management for session handling

## Troubleshooting

### Port Already in Use

If you see `EADDRINUSE: address already in use :::3000`:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or change the port in .env
PORT=3001
```

### Email Errors

If emails aren't working:
- Check EMAIL_USER and EMAIL_PASSWORD in `.env`
- For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)
- Email is optional - the API works without it

### Database Issues

To reset the database:

```bash
rm food-search.db
npm start  # Database will be recreated
```

## Next Steps

1. **Read the Full Documentation**: See [README.md](README.md) for complete details
2. **Explore Swagger UI**: Visit http://localhost:3000/api-docs
3. **Customize**: Modify allowed email domains in `.env`
4. **Deploy**: Check the Production Deployment section in README.md

## API Endpoint Categories

- **Authentication** (`/api/auth`) - Login, register, logout
- **Users** (`/api/users`) - User management
- **Meal Options** (`/api/meal-options`) - Available meal options
- **Meal Selections** (`/api/meal-selections`) - Order meals
- **Reviews** (`/api/reviews`) - Rate and review meals
- **Search** (`/api/search`) - Find colleague orders
- **Admin** (`/api/admin`) - Administrative functions

## Support

For issues or questions, refer to the [full README](README.md) or check the interactive documentation at http://localhost:3000/api-docs.

Happy coding! 🚀
