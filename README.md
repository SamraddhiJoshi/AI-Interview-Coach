# AI Interview Coach — Authentication Module

Complete MERN stack authentication system with JWT, bcrypt, and a polished React UI.

---

## 📁 Folder Structure

```
ai-interview-coach/
├── server/                        # Node.js + Express backend
│   ├── config/
│   │   └── db.js                  # MongoDB Atlas connection
│   ├── controllers/
│   │   └── authController.js      # Register, Login, GetMe logic
│   ├── middleware/
│   │   ├── auth.js                # JWT protect middleware
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   └── User.js                # Mongoose User schema
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth/* routes
│   │   └── dashboardRoutes.js     # /api/dashboard (protected)
│   ├── .env.example
│   ├── index.js                   # Express app entry point
│   └── package.json
│
└── client/                        # React + Vite frontend
    ├── src/
    │   ├── api/
    │   │   ├── axios.js           # Axios instance + interceptors
    │   │   └── auth.js            # API call functions
    │   ├── components/
    │   │   └── ProtectedRoute.jsx # Auth guard component
    │   ├── context/
    │   │   └── AuthContext.jsx    # Global auth state
    │   ├── pages/
    │   │   ├── Register.jsx       # Registration page
    │   │   ├── Login.jsx          # Login page
    │   │   └── Dashboard.jsx      # Protected dashboard
    │   ├── App.jsx                # Router setup
    │   ├── main.jsx
    │   └── index.css              # Tailwind + custom styles
    ├── .env.example
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Environment Variables

### Server (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai-interview-coach?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Installation & Setup

### 1. Clone and navigate
```bash
cd ai-interview-coach
```

### 2. Backend setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret
npm run dev
```

### 3. Frontend setup (new terminal)
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

### 4. Open in browser
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

---

## 🔌 API Endpoints

| Method | Endpoint           | Access    | Description              |
|--------|--------------------|-----------|--------------------------|
| POST   | /api/auth/register | Public    | Register new user        |
| POST   | /api/auth/login    | Public    | Login, returns JWT       |
| GET    | /api/auth/me       | Private   | Get current user info    |
| GET    | /api/dashboard     | Private   | Protected dashboard data |
| GET    | /api/health        | Public    | API health check         |

### Request Bodies

**Register:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Login:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Auth Header (protected routes):**
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Security Features

- Passwords hashed with **bcryptjs** (salt rounds: 12)
- **JWT** tokens with configurable expiry
- Password excluded from all DB queries by default (`select: false`)
- Input validation via **express-validator**
- CORS configured for frontend origin only
- Request size limited to 10kb
- Global error handler (no stack traces in production)
- Axios interceptor auto-clears expired tokens

---

## 🧪 Test with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"pass123"}'

# Protected route (replace TOKEN with JWT from login)
curl http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer TOKEN"
```
