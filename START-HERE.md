# Make Charcha work — simple steps

Do these in order.

---

## Step 1: Install PostgreSQL (if you don’t have it)

1. Go to: https://www.postgresql.org/download/windows/
2. Download and run the installer.
3. When it asks for a **password**, choose one and **remember it** (e.g. `mypass123`). You will need it later.
4. Finish the install (default options are fine).

---

## Step 2: Create the database

1. Open **pgAdmin** (it installs with PostgreSQL). You find it in the Start menu.
2. When it opens, click your **PostgreSQL** server (it may ask for the password you set in Step 1).
3. Right‑click **Databases**.
4. Click **Create** → **Database**.
5. In **Database** name, type: **charcha**
6. Click **Save**.

You only need to do this once.

---

## Step 3: Tell the app your database password

1. Open the project folder: **CharchaProject**.
2. Go into the **server** folder.
3. Open the file **.env** in Notepad (or any editor). If you don’t see it, turn on “Show hidden files” or open it from your editor.
4. Find the line that says:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/charcha
   ```
5. Replace **YOUR_POSTGRES_PASSWORD** with the **exact password** you set for PostgreSQL in Step 1.  
   Example: if your password is `mypass123`, that line should be:
   ```
   DATABASE_URL=postgresql://postgres:mypass123@localhost:5432/charcha
   ```
6. Save the file and close it.

---

## Step 4: Install the app (if you haven’t already)

1. Open **PowerShell** or **Command Prompt**.
2. Go to the project folder. Type (use your real path):
   ```
   cd "c:\Users\titiksha raj pandey\OneDrive\Documents\CharchaProject"
   ```
3. Run:
   ```
   npm install
   ```
4. Wait until it finishes (no red errors).

---

## Step 5: Set up the app’s tables in the database

In the **same** project folder, run:

```
npm run db:push
```

You should see something like “Your database is now in sync.”  
If you see a password or connection error, go back to Step 3 and fix the password in **server/.env**.

---

## Step 6: Start the app

In the **same** folder, run:

```
npm run dev
```

Wait until you see something like:
- “Charcha server running on port 5000”
- “Local: http://localhost:5173/”

---

## Step 7: Open the app in your browser

1. Open your browser (Chrome, Edge, etc.).
2. In the address bar type: **http://localhost:5173**
3. Press Enter.

You should see the Charcha login page.  
Click **Sign up**, create an account, then you can log in and use the app.

---

## If something goes wrong

- **“Authentication failed” or “password” error**  
  Your database password in **server/.env** is wrong. Repeat Step 3 and use the exact PostgreSQL password.

- **“npm install” fails**  
  Try moving the project folder out of OneDrive (e.g. to `C:\Projects\CharchaProject`) and run the steps again from there.

- **“Cannot find database” or “database does not exist”**  
  Repeat Step 2 and make sure the database is named exactly **charcha**.

- **Port already in use**  
  Close any other copy of the app or anything else using port 5000 or 5173, then run `npm run dev` again.

---

## Quick checklist

- [ ] PostgreSQL installed, password remembered  
- [ ] Database **charcha** created in pgAdmin  
- [ ] **server/.env** updated with your real password  
- [ ] `npm install` done  
- [ ] `npm run db:push` run successfully  
- [ ] `npm run dev` running  
- [ ] Opened http://localhost:5173 in the browser  

When all are done, the app should work.
