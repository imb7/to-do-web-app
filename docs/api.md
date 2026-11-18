# REST API Specification

The Simple To-Do Application exposes a standard RESTful API under the `/api` prefix. All authenticated endpoints require a valid JWT token passed either via the `Authorization: Bearer <token>` header or as an HTTP-only `token` cookie.

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new user account with strong password hashing.

- **Rate Limit:** 15 requests per 15 minutes.
- **Request Body:**
  ```json
  {
    "username": "developer_alex",
    "password": "SecurePassword123!"
  }
  ```
- **Validation Rules:**
  - `username`: 4-30 characters, alphanumeric and underscores only (`^[a-zA-Z0-9_]{4,30}$`). Must be unique.
  - `password`: Minimum 12 characters, >=1 uppercase, >=1 lowercase, >=1 number, >=1 special character.
- **Responses:**
  - `201 Created`: User created successfully. Returns token and user object.
  - `400 Bad Request`: Input validation failed.
  - `409 Conflict`: Username is already taken.

---

### `POST /api/auth/login`
Authenticates an existing user and returns a signed JWT.

- **Rate Limit:** 15 requests per 15 minutes.
- **Request Body:**
  ```json
  {
    "username": "developer_alex",
    "password": "SecurePassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: Login successful. Sets HTTP-only `token` cookie and returns payload:
    ```json
    {
      "success": true,
      "message": "Login successful.",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsIn...",
        "user": {
          "id": 1,
          "username": "developer_alex"
        }
      }
    }
    ```
  - `401 Unauthorized`: Invalid credentials. Generic message returned to prevent username enumeration.

---

### `POST /api/auth/logout`
Terminates the user session and clears the authentication cookie.

- **Responses:**
  - `200 OK`: Logged out successfully.

---

### `GET /api/auth/me`
Retrieves the profile of the currently authenticated user.

- **Headers:** `Authorization: Bearer <token>`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "id": 1,
          "username": "developer_alex",
          "created_at": "2026-11-15 17:00:00"
        }
      }
    }
    ```
  - `401 Unauthorized`: Token missing or expired.

---

## 2. To-Do Tasks Endpoints

All task endpoints require authentication and automatically enforce user ownership.

### `POST /api/tasks`
Creates a new task.

- **Request Body:**
  ```json
  {
    "title": "Configure AWS Production Environment",
    "description": "Setup security groups and IAM roles",
    "due_date": "2026-11-20"
  }
  ```
- **Validation Rules:**
  - `title`: Required, 1-255 characters.
  - `description`: Optional text.
  - `due_date`: Optional string in `YYYY-MM-DD` format.
- **Responses:**
  - `201 Created`: Task created successfully. Returns task object.

---

### `GET /api/tasks`
Retrieves all tasks for the authenticated user with optional filtering, search, and sorting.

- **Query Parameters:**
  - `status`: Optional. Filter by `'PENDING'` or `'COMPLETED'`.
  - `search`: Optional string. Matches title or description.
  - `sortBy`: Optional. `'created_at'` (default), `'due_date'`, `'title'`, `'status'`, `'updated_at'`.
  - `order`: Optional. `'ASC'` or `'DESC'` (default).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "tasks": [
          {
            "id": 1,
            "user_id": 1,
            "title": "Configure AWS Production Environment",
            "description": "Setup security groups and IAM roles",
            "status": "PENDING",
            "due_date": "2026-11-20",
            "created_at": "2026-11-15 17:00:00",
            "updated_at": "2026-11-15 17:00:00",
            "completed_at": null
          }
        ],
        "count": 1
      }
    }
    ```

---

### `GET /api/tasks/:id`
Retrieves a single task by ID.

- **Responses:**
  - `200 OK`: Returns task.
  - `404 Not Found`: Task does not exist or belongs to another user.

---

### `PUT /api/tasks/:id`
Updates an existing task's title, description, or due date.

- **Request Body:**
  ```json
  {
    "title": "Updated Task Title",
    "description": "Updated context",
    "due_date": "2026-11-25"
  }
  ```
- **Responses:**
  - `200 OK`: Returns updated task.
  - `404 Not Found`: Task does not exist or belongs to another user.

---

### `DELETE /api/tasks/:id`
Permanently deletes a task.

- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Task deleted successfully." }`
  - `404 Not Found`: Task does not exist or belongs to another user.

---

### `PATCH /api/tasks/:id/complete`
Marks a task as completed. Sets `status = 'COMPLETED'` and records `completed_at = CURRENT_TIMESTAMP`.

- **Responses:**
  - `200 OK`: Returns task with completed status and timestamp.
  - `404 Not Found`: Task does not exist or belongs to another user.

---

### `PATCH /api/tasks/:id/pending`
Reopens a completed task. Sets `status = 'PENDING'` and clears `completed_at = null`.

- **Responses:**
  - `200 OK`: Returns task with pending status.
  - `404 Not Found`: Task does not exist or belongs to another user.

---

## 3. Historical Reports Endpoints

Historical endpoints query MySQL directly using composite indexes `(user_id, created_at)`.

### `GET /api/tasks/history/daily?date=YYYY-MM-DD`
Retrieves all tasks created on a specific calendar day.

- **Query Parameters:** `date` (format: `YYYY-MM-DD`).
- **Responses:**
  - `200 OK`: Returns daily tasks, total count, pending count, and completed count.

---

### `GET /api/tasks/history/monthly?month=MM&year=YYYY`
Retrieves all tasks created during a calendar month, grouped by date.

- **Query Parameters:**
  - `month`: 1 to 12.
  - `year`: 4-digit year (e.g. 2026).
- **Responses:**
  - `200 OK`: Returns total count, pending count, completed count, and `groupedByDate` object mapping dates to task arrays.

---

### `GET /api/tasks/history/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
Retrieves all tasks created within a date range.

- **Query Parameters:**
  - `startDate`: `YYYY-MM-DD`
  - `endDate`: `YYYY-MM-DD` (`startDate <= endDate`)
- **Responses:**
  - `200 OK`: Returns tasks within range and grouped by date.

---

## 4. Dashboard Endpoints

### `GET /api/dashboard/summary`
Retrieves aggregate metrics and recent tasks for the authenticated user.

- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "user": { "id": 1, "username": "developer_alex" },
        "summary": {
          "totalTasks": 12,
          "pendingTasks": 4,
          "completedTasks": 8,
          "dueToday": 2,
          "completionPercentage": 67,
          "recentTasks": [...]
        }
      }
    }
    ```
