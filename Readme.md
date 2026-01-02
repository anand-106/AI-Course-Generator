# AI Course Generator

A full-stack application for generating AI-powered courses using FastAPI (backend) and React (frontend).

## Project Structure

```
AI-Course-Generator-MAIN/
├── backend/          # FastAPI backend
│   └── app/
│       ├── main.py   # FastAPI application entry point
│       ├── db.py     # MongoDB connection
│       └── ...
└── frontend/         # React + Vite frontend
    └── src/
        └── ...
```

## Prerequisites

- **Python 3.8+** (for backend)
- **Node.js 16+** and **npm** (for frontend)
- **MongoDB Atlas account** (or local MongoDB instance)
- **Google API Key** (for Gemini AI - optional but recommended)

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the **project root** directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=your_database_name

# Google AI (Optional - for course generation features)
GOOGLE_API_KEY=your_google_api_key
```

**Example MongoDB Atlas URI:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```bash
   # Option 1: Using uvicorn directly
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   # Option 2: Using Python
   python -m app.main
   ```

   The backend will run on `http://localhost:8000`

   You can access the API documentation at:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### 3. Frontend Setup

1. Open a **new terminal** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create a `.env` file in the `frontend` directory if you need to customize the API URL:
   ```env
   VITE_API_BASE=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173` (default Vite port)

## Running the Project

1. **Start the backend** (Terminal 1):
   ```bash
   cd backend
   # Activate virtual environment if using one
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

## API Endpoints

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/signin` - Login user

### Course Generation
- `POST /course/generate` - Generate a course based on a prompt

## Troubleshooting

### Backend Issues

1. **MongoDB Connection Error**:
   - Verify your `MONGODB_URI` in the `.env` file
   - Ensure your MongoDB Atlas IP whitelist includes your IP address
   - Check if `DATABASE_NAME` is set correctly

2. **Module Not Found Errors**:
   - Ensure you're in the backend directory
   - Activate your virtual environment
   - Reinstall requirements: `pip install -r requirements.txt`

3. **Port Already in Use**:
   - Change the port in `main.py` or use: `uvicorn app.main:app --port 8001`

### Frontend Issues

1. **Cannot Connect to Backend**:
   - Verify backend is running on port 8000
   - Check CORS settings in `backend/app/main.py`
   - Verify `VITE_API_BASE` in frontend `.env` if set

2. **Dependencies Installation Issues**:
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and `package-lock.json`, then reinstall

## Production Build

### Backend
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
npm run preview  # Preview production build
```

## Technologies Used

- **Backend**: FastAPI, MongoDB, LangChain, LangGraph, Google Generative AI
- **Frontend**: React, Vite, Tailwind CSS, Mermaid.js
- **Database**: MongoDB Atlas

## Notes

- The `.env` file should be in the **project root** (not in backend or frontend folders)
- Make sure both servers are running simultaneously for the app to work
- Google API Key is optional but required for AI-powered course generation features
