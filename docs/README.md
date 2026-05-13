# QuickServe – Setup & Run Guide

## Tech Stack
- **Frontend**: HTML, CSS, Bootstrap 5, Vanilla JS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (cloud)
- **Auth**: JWT (JSON Web Tokens) + bcryptjs

---

## Admin Credentials
```
Email:    admin@quickserve.com
Password: admin123
```
Admin is auto-created when the server starts for the first time.

---

## How to Run

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Server
```bash
node server.js
```
Or with auto-reload:
```bash
npm run dev
```

### 3. Open in Browser
Go to: **http://localhost:3000**

---

## Project Structure
```
final-project-Code-Buster-BSIT2b/
├── backend/
│   ├── config/db.js          — MongoDB connection
│   ├── middleware/
│   │   ├── auth.js           — JWT authentication middleware
│   │   └── admin.js          — Admin role check middleware
│   ├── models/
│   │   ├── User.js           — User schema (bcrypt password hashing)
│   │   ├── Product.js        — Product schema
│   │   ├── Order.js          — Order schema
│   │   └── Review.js         — Review schema
│   ├── routes/
│   │   ├── authRoutes.js     — POST /api/auth/login
│   │   ├── userRoutes.js     — CRUD /api/users
│   │   ├── productRoutes.js  — CRUD /api/products
│   │   ├── orderRoutes.js    — CRUD /api/orders
│   │   └── reviewRoutes.js   — CRUD /api/reviews
│   ├── .env                  — Environment variables
│   ├── server.js             — Express server entry point
│   └── seed.js               — Optional: seed product data
│
└── frontend/
    ├── index.html            — Home page
    ├── register.html         — Registration page
    ├── login.html            — Login page
    ├── dashboard.html        — User dashboard (protected)
    ├── products.html         — Product listing
    ├── product-details.html  — Single product page
    ├── cart.html             — Shopping cart + checkout
    ├── orders.html           — Order history (protected)
    ├── profile.html          — User profile (protected)
    ├── admin.html            — Admin dashboard (admin only)
    └── js/
        ├── app.js            — Cart, filters, notifications
        ├── auth-guard.js     — Auth utilities, navbar, logout
        ├── register.js       — Registration form handler
        ├── login.js          — Login form handler
        ├── dashboard-data.js — Dashboard data loader
        ├── products-data.js  — Products list loader
        ├── product-details-data.js — Single product loader
        ├── orders-data.js    — Order history loader
        ├── profile.js        — Profile update handler
        ├── checkout.js       — Order placement handler
        └── review.js         — Review submission handler
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/login | Public | Login, returns JWT token |

### Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/users | Public | Register new user |
| GET | /api/users | Admin | Get all users |
| GET | /api/users/:id | Auth | Get user profile |
| PUT | /api/users/:id | Auth | Update user profile |
| PUT | /api/users/:id/password | Auth | Change password |
| DELETE | /api/users/:id | Admin | Delete user |

### Products
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/products | Public | Get all products |
| GET | /api/products/:id | Public | Get single product |
| POST | /api/products | Admin | Create product |
| PUT | /api/products/:id | Admin | Update product |
| DELETE | /api/products/:id | Admin | Delete product |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/orders | Auth | Place new order |
| GET | /api/orders | Admin | Get all orders |
| GET | /api/orders/user/:id | Auth | Get user's orders |
| PUT | /api/orders/:id/status | Admin | Update order status |
| PUT | /api/orders/:id/cancel | Auth | Cancel pending order |

### Reviews
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/reviews | Auth | Submit review |
| GET | /api/reviews | Admin | Get all reviews |
| GET | /api/reviews/product/:id | Public | Get product reviews |
| DELETE | /api/reviews/:id | Admin | Delete review |

---
Live Deployment
---
Render Link: https://quickserve-j4u8.onrender.com

---

Clear Instructions how to clone the Project

1.Open VS Code

2.Click Terminal → New Terminal

3.Choose where you want to save the project:

In terminal add:

cd Desktop

4.Paste the clone command:

In terminal add:

git clone https://github.com/maicelsadia-png/final-project-Code-Buster-BSIT2b.git

5.Wait for it to finish downloading.

6.Open the project folder:
In termina add:

cd final-project-Code-Buster-BSIT2b

7.Open it in VS Code:

In terminal add:

code. 

---

