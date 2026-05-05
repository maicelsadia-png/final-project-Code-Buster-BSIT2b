# User Management API - Backend

A simple backend API that lets you create, read, update, and delete users. Built with Express and MongoDB.

---

## 📌 Routes (API Endpoints)

These are the URLs you can call to work with users:

| What it does | Method | URL |
|--------------|--------|-----|
| Create a new user | POST | `/api/users` |
| Get all users | GET | `/api/users` |
| Get one user by ID | GET | `/api/users/:id` |
| Update a user by ID | PUT | `/api/users/:id` |
| Delete a user by ID | DELETE | `/api/users/:id` |

> `:id` means you replace it with the actual user ID, like `/api/users/65abc123`

---

## 📦 User Model (What a user looks like)

Each user in the database has these 4 fields:

| Field | Type | What it stores |
|-------|------|----------------|
| name | String | The person's full name |
| email | String | Email address (used for login) |
| password | String | Account password |
| role | String | User type like "admin" or "customer" |

---

## 🔌 How the Connection Works

- **Database:** MongoDB Atlas (cloud database)
- **Connector:** Mongoose (helps JavaScript talk to MongoDB)
- **Credentials:** Stored in a `.env` file (not shared on GitHub)
- **Server Port:** 3000 by default

The connection happens in `config/db.js`. When you start the server, it automatically connects to MongoDB.

---

## 🚀 How to Run This Backend on Your Computer

### Step 1: Get the code
```bash
git clone <your-repo-url>
cd your-project/backend