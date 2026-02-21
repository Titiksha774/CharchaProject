# Fix "Authentication failed" / Invalid database credentials

PostgreSQL is running but the app is using credentials that don't match your setup. Use **one** of the options below.

---

## Option 1: Use default `postgres` user (quickest)

If you installed PostgreSQL locally, you usually have a user `postgres` with a password you set during installation.

1. Open **server/.env** and set `DATABASE_URL` to (use your real password):

   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/charcha
   ```

   Replace `YOUR_PASSWORD` with the password you use for the `postgres` user.

2. Create the database once (in pgAdmin, or run in PowerShell):

   ```powershell
   # If psql is in your PATH (e.g. C:\Program Files\PostgreSQL\16\bin\psql.exe)
   $env:PGPASSWORD = "YOUR_PASSWORD"
   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE charcha;"
   ```

   Or in **pgAdmin**: right-click "Databases" → Create → Database → name: `charcha` → Save.

3. From the project root, run:

   ```powershell
   npm run db:push
   ```

4. Restart the app (`npm run dev`).

---

## Option 2: Create a `charcha` user (matches original config)

If you prefer to keep the app user separate:

1. In **pgAdmin** or **psql**, connect as `postgres` and run:

   ```sql
   CREATE USER charcha WITH PASSWORD 'charcha_secret';
   CREATE DATABASE charcha OWNER charcha;
   GRANT ALL PRIVILEGES ON DATABASE charcha TO charcha;
   \c charcha
   GRANT ALL ON SCHEMA public TO charcha;
   ```

2. In **server/.env** use:

   ```
   DATABASE_URL=postgresql://charcha:charcha_secret@localhost:5432/charcha
   ```

3. From the project root:

   ```powershell
   npm run db:push
   ```

4. Restart the app (`npm run dev`).

---

## Option 3: Use Docker (fresh PostgreSQL with correct user)

If you have Docker Desktop:

```powershell
docker run -d --name charcha-db -e POSTGRES_USER=charcha -e POSTGRES_PASSWORD=charcha_secret -e POSTGRES_DB=charcha -p 5432:5432 postgres:16-alpine
```

Then in **server/.env**:

```
DATABASE_URL=postgresql://charcha:charcha_secret@localhost:5432/charcha
```

Run:

```powershell
npm run db:push
npm run dev
```

---

## Summary

- **server/.env** is what the app and Prisma use. Edit that file with the correct username, password, and database name.
- After changing **server/.env**, run **npm run db:push** once, then start the app with **npm run dev**.
