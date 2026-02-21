# How to set database credentials

The app reads credentials from **server/.env** in one variable: **DATABASE_URL**.

---

## Step 1: Pick how you connect to PostgreSQL

### A) You installed PostgreSQL on your PC (e.g. from postgresql.org)

You have a **postgres** user and a password you chose during install.

1. Open **server/.env** in a text editor.
2. Find the line that starts with `DATABASE_URL=`.
3. Set it to (use **your real postgres password**):

   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/charcha
   ```

   Example: if your password is `mypass123`:

   ```
   DATABASE_URL=postgresql://postgres:mypass123@localhost:5432/charcha
   ```

4. Save the file.

### B) You use Docker for PostgreSQL

Run:

```powershell
docker run -d --name charcha-db -e POSTGRES_USER=charcha -e POSTGRES_PASSWORD=charcha_secret -e POSTGRES_DB=charcha -p 5432:5432 postgres:16-alpine
```

Then in **server/.env** set:

```
DATABASE_URL=postgresql://charcha:charcha_secret@localhost:5432/charcha
```

---

## Step 2: Create the database (only for option A)

If you use the **postgres** user, create the `charcha` database once.

**Using pgAdmin**

1. Open pgAdmin and connect to your server.
2. Right‑click **Databases** → **Create** → **Database**.
3. Name: **charcha**.
4. Save.

**Using psql (command line)**

```powershell
# Open psql (adjust path if your PostgreSQL is in a different folder)
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE charcha;"
```

It will ask for your postgres password.

---

## Step 3: Apply schema and run the app

From the **project root** (CharchaProject folder):

```powershell
npm run db:push
npm run dev
```

If `DATABASE_URL` in **server/.env** is correct and the database exists, the app will connect and work.

---

## Format of DATABASE_URL

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

- **USERNAME** – PostgreSQL user (e.g. `postgres` or `charcha`).
- **PASSWORD** – That user’s password. No quotes.
- **HOST** – Usually `localhost`.
- **PORT** – Usually `5432`.
- **DATABASE_NAME** – Use `charcha` for this app.

If your password has special characters (e.g. `#`, `@`, `%`), you may need to URL‑encode them (e.g. `@` → `%40`).
