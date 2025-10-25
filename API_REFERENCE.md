# API Reference

Quick reference guide for all Food Search API endpoints.

## Base URL

```
http://localhost:3000
```

## Authentication

All protected endpoints require a session cookie obtained through login.

---

## Authentication Endpoints

### POST /api/auth/login
Login user and create session.

**Request Body:**
```json
{
  "email": "user@devhub.tech",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "email": "user@devhub.tech",
    "is_admin": false,
    "employee_name": "User Name"
  }
}
```

---

### POST /api/auth/register
Register new user account.

**Request Body:**
```json
{
  "email": "newuser@devhub.tech",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Cont creat cu succes!"
}
```

---

### POST /api/auth/logout
Logout and destroy session.

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

### GET /api/auth/me
Get current authenticated user.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "email": "user@devhub.tech",
    "is_admin": false,
    "employee_name": "User Name"
  }
}
```

---

## User Endpoints

### GET /api/users/employees
Get employee names from current menu.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "employees": ["John Doe", "Jane Smith", "Bob Johnson"]
}
```

---

### POST /api/users/me/employee-name
Set employee name for current user.

**Auth Required:** Yes

**Request Body:**
```json
{
  "employee_name": "John Doe"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Nume asignat cu succes"
}
```

---

### GET /api/users/employees/names
Get all employee names (for autocomplete).

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "names": ["Alexandru Popescu", "Maria Ionescu", "Ion Vasilescu"]
}
```

---

### POST /api/users
Create new user (Admin only).

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "email": "newuser@devhub.tech",
  "password": "password123",
  "is_admin": false
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Utilizator creat cu succes"
}
```

---

### GET /api/users
Get all users (Admin only).

**Auth Required:** Yes (Admin)

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@devhub.tech",
      "employee_name": "User Name",
      "is_admin": false,
      "is_active": true
    }
  ]
}
```

---

## Meal Options Endpoints

### POST /api/meal-options/upload
Upload meal options from Excel file (Admin only).

**Auth Required:** Yes (Admin)

**Request:** `multipart/form-data`
- `file`: Excel file (.xlsx, .xls)
- `week_start_date`: (optional) YYYY-MM-DD

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Successfully uploaded 5 meal option categories",
  "week_start_date": "2024-11-20"
}
```

---

### GET /api/meal-options
Get meal options for a week.

**Auth Required:** Yes

**Query Parameters:**
- `week` (optional): Week start date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "options": [
    {
      "id": 1,
      "week_start_date": "2024-11-20",
      "category": "Meniu 1",
      "monday": "Ciorbă\nPui cu orez",
      "tuesday": "Supă\nPaste",
      "period": "20-24",
      "source_file": "FOOD 20-24.xlsx"
    }
  ],
  "week_start_date": "2024-11-20"
}
```

---

## Meal Selection Endpoints

### POST /api/meal-selections
Save meal selection for current user.

**Auth Required:** Yes

**Request Body:**
```json
{
  "week_start_date": "2024-11-20",
  "monday": "Meniu 1 | Salată verde",
  "tuesday": "Meniu 2",
  "wednesday": "Special Fish",
  "thursday": "Meniu 1 | Extra soup",
  "friday": "Meniu 3 | Salată mix"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Meal selections saved successfully"
}
```

---

### GET /api/meal-selections/me
Get current user's meal selection.

**Auth Required:** Yes

**Query Parameters:**
- `week` (optional): Week start date

**Response:** `200 OK`
```json
{
  "selection": {
    "id": 1,
    "user_id": 1,
    "week_start_date": "2024-11-20",
    "monday": "Meniu 1",
    "tuesday": "Meniu 2",
    "created_at": "2024-11-18T10:30:00.000Z",
    "updated_at": "2024-11-18T10:30:00.000Z"
  },
  "week_start_date": "2024-11-20"
}
```

---

### GET /api/meal-selections/history
Get user's meal selection history.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "history": [
    {
      "week_start_date": "2024-11-20",
      "period": "20-24",
      "monday": "Meniu 1",
      "tuesday": "Meniu 2",
      "source": "selection"
    }
  ]
}
```

---

### GET /api/meal-selections/all
Get all meal selections (Admin only).

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `week` (optional): Week start date

**Response:** `200 OK`
```json
{
  "selections": [
    {
      "id": 1,
      "user_id": 1,
      "email": "user@devhub.tech",
      "employee_name": "John Doe",
      "week_start_date": "2024-11-20",
      "monday": "Meniu 1",
      "tuesday": "Meniu 2"
    }
  ],
  "week_start_date": "2024-11-20"
}
```

---

### POST /api/meal-selections/import
Import selections from Excel (Admin only).

**Auth Required:** Yes (Admin)

**Request:** `multipart/form-data`
- `file`: Excel file
- `week_start_date`: (optional) YYYY-MM-DD

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Import finalizat cu succes!",
  "imported": 25,
  "failed": 0,
  "period": "20-24",
  "details": []
}
```

---

### GET /api/meal-selections/statistics
Get meal statistics (Admin only).

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `week` (optional): Week start date

**Response:** `200 OK`
```json
{
  "statistics": {
    "monday": {
      "Meniu 1": 15,
      "Meniu 2": 10,
      "total": 25
    },
    "tuesday": {
      "Meniu 1": 12,
      "Meniu 2": 13,
      "total": 25
    }
  },
  "week_start_date": "2024-11-20"
}
```

---

### GET /api/meal-selections/statistics/export
Export statistics to Excel (Admin only).

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `week` (optional): Week start date

**Response:** `200 OK` (Excel file download)

---

### GET /api/meal-selections/export
Export selections to Excel (Admin only).

**Auth Required:** Yes (Admin)

**Query Parameters:**
- `week` (optional): Week start date

**Response:** `200 OK` (Excel file download)

---

## Review Endpoints

### POST /api/reviews
Save or update meal review.

**Auth Required:** Yes

**Request Body:**
```json
{
  "mealName": "Ciorbă de burtă",
  "reviewText": "Very tasty and authentic!",
  "rating": 5,
  "weekStartDate": "2024-11-20",
  "dayOfWeek": "monday"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Review salvat cu succes"
}
```

---

### GET /api/reviews
Get all reviews for a meal.

**Auth Required:** Yes

**Query Parameters:**
- `mealName`: Meal name (required)
- `weekStartDate`: Week start date (required)
- `dayOfWeek`: Day of week (required)

**Response:** `200 OK`
```json
{
  "reviews": [
    {
      "id": 1,
      "user_id": 1,
      "meal_name": "Ciorbă de burtă",
      "review_text": "Delicious!",
      "rating": 5,
      "week_start_date": "2024-11-20",
      "day_of_week": "monday",
      "email": "user@devhub.tech",
      "employee_name": "John Doe",
      "created_at": "2024-11-18T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/reviews/my-review
Get current user's review for a meal.

**Auth Required:** Yes

**Query Parameters:**
- `mealName`: Meal name (required)
- `weekStartDate`: Week start date (required)
- `dayOfWeek`: Day of week (required)

**Response:** `200 OK`
```json
{
  "review": {
    "id": 1,
    "meal_name": "Ciorbă de burtă",
    "review_text": "Great taste!",
    "rating": 5
  }
}
```

---

### GET /api/reviews/my-reviews
Get all reviews by current user.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "reviews": [
    {
      "id": 1,
      "meal_name": "Ciorbă de burtă",
      "review_text": "Delicious!",
      "rating": 5,
      "week_start_date": "2024-11-20",
      "day_of_week": "monday",
      "created_at": "2024-11-18T10:00:00.000Z"
    }
  ]
}
```

---

### GET /api/reviews/recent
Get recent reviews for a meal.

**Auth Required:** Yes

**Query Parameters:**
- `mealName`: Meal name (required)

**Response:** `200 OK`
```json
{
  "reviews": [
    {
      "id": 3,
      "meal_name": "Ciorbă de burtă",
      "review_text": "Amazing!",
      "rating": 5,
      "email": "user@devhub.tech",
      "employee_name": "John Doe"
    }
  ]
}
```

---

## Search Endpoints

### GET /api/search/weeks
Get available weeks.

**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "weeks": ["2024-11-20", "2024-11-13"]
}
```

---

### GET /api/search/meals
Get meals for a week.

**Auth Required:** Yes

**Query Parameters:**
- `week`: Week start date (required)

**Response:** `200 OK`
```json
{
  "meals": [
    {
      "employee_name": "John Doe",
      "week_start_date": "2024-11-20",
      "monday": "Meniu 1",
      "tuesday": "Meniu 2"
    }
  ],
  "week_start_date": "2024-11-20"
}
```

---

### GET /api/search
Search for colleague's meals by name.

**Auth Required:** Yes

**Query Parameters:**
- `name`: Employee name to search (required)

**Response:** `200 OK`
```json
{
  "meals": [
    {
      "employee_name": "John Doe",
      "monday": "Meniu 1",
      "tuesday": "Meniu 2"
    }
  ],
  "isFromPreviousWeek": false,
  "week": "2024-11-20",
  "currentWeek": "2024-11-20"
}
```

---

## Admin Endpoints

### GET /api/admin/weeks
Get all available weeks (Admin only).

**Auth Required:** Yes (Admin)

**Response:** `200 OK`
```json
{
  "weeks": ["2024-11-20", "2024-11-13", "2024-11-06"]
}
```

---

### DELETE /api/admin/weeks/:weekStartDate
Delete all data for a week (Admin only).

**Auth Required:** Yes (Admin)

**URL Parameters:**
- `weekStartDate`: Week start date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Datele pentru săptămâna au fost șterse cu succes"
}
```

---

## HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production.

## CORS

By default, CORS is configured to allow requests from `http://localhost:3000`. Update `CORS_ORIGIN` in `.env` to change this.

## Session Cookies

Sessions last for 24 hours by default. The session cookie is:
- HTTP-only
- Secure in production
- SameSite: strict in production, lax in development

---

For more details, visit the interactive documentation at http://localhost:3000/api-docs
