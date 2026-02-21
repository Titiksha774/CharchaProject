# Local Development Setup Guide

## Option 1: Using Docker (Easiest)

### Step 1: Start PostgreSQL with Docker
```powershell
docker run -d --name charcha-db -e POSTGRES_USER=charcha -e POSTGRES_PASSWORD=charcha_secret -e POSTGRES_DB=charcha -p 5432:5432 postgres:16-alpine
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Set up Database Schema
```powershell
npm run db:push
```

### Step 4: Start Development Server
```powershell
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## Option 2: Using Local PostgreSQL

### Step 1: Install PostgreSQL
If you don't have PostgreSQL installed:
- Download from: https://www.postgresql.org/download/windows/
- Or use a package manager like Chocolatey: `choco install postgresql`

### Step 2: Create Database
Open PostgreSQL command line or pgAdmin and run:
```sql
CREATE USER charcha WITH PASSWORD 'charcha_secret';
CREATE DATABASE charcha OWNER charcha;
GRANT ALL PRIVILEGES ON DATABASE charcha TO charcha;
```

Or if using default postgres user:
```sql
CREATE DATABASE charcha;
```

Then update `.env` file:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/charcha
```

### Step 3: Install Dependencies
```powershell
npm install
```

### Step 4: Set up Database Schema
```powershell
npm run db:push
```

### Step 5: Start Development Server
```powershell
npm run dev
```

---

## Troubleshooting

### If npm install fails with permission errors:
- Move the project folder outside OneDrive
- Or run PowerShell as Administrator

### If database connection fails:
- Check PostgreSQL is running: `Get-Service postgresql*`
- Verify DATABASE_URL in `.env` matches your PostgreSQL setup
- Check PostgreSQL is listening on port 5432

### If port 5000 or 5173 is already in use:
- Change PORT in `.env` file
- Or stop the application using those ports

---

## First Time Setup Checklist

- [ ] PostgreSQL is running (Docker or local)
- [ ] `.env` file exists with correct DATABASE_URL
- [ ] `npm install` completed successfully
- [ ] `npm run db:push` created database tables
- [ ] `npm run dev` starts both frontend and backend

---

## Testing the App

1. Open http://localhost:5173 in your browser
2. Click "Sign up" to create an account
3. Create your first post
4. Add comments to posts
5. Like posts
6. View profiles

---

## Stop the App

Press `Ctrl+C` in the terminal to stop the dev server.

To stop Docker PostgreSQL:
```powershell
docker stop charcha-db
docker rm charcha-db
```
