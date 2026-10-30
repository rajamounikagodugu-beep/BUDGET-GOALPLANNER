# Budget Goal Planner

A beginner-friendly full-stack web application for recording income and expenses, reviewing a monthly budget, and tracking savings goals. The interface uses HTML, CSS, and vanilla JavaScript; the API uses Node.js and Express; data is stored persistently in Supabase PostgreSQL.

> **Important project scope:** This is a single shared planner intended for a local college demonstration. It does not include user accounts or private per-user records. Do not deploy it publicly as-is. Add authentication, user ownership, authorization, and matching Row Level Security policies before public deployment.

## Features

- Dashboard with monthly income, expenses, available balance, and savings goal progress.
- Add, edit, search, filter, and delete transactions.
- Create savings goals with optional target dates.
- Add contributions to goals with a database function that prevents saving more than the target.
- Responsive layout for desktop, tablet, and mobile.
- Server-side validation, JSON API errors, basic security headers, and a health endpoint.

## Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js 20+ and Express.js
- Supabase PostgreSQL and `@supabase/supabase-js`
- Git and GitHub

## Folder structure

```text
budget-goal-planner/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── routes/
│   │   ├── transactions.js
│   │   └── goals.js
│   ├── middleware/
│   │   └── validate.js
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## Prerequisites

Install these on Windows:

1. [Node.js LTS](https://nodejs.org/) (includes npm; use Node.js 20 or newer).
2. [Visual Studio Code](https://code.visualstudio.com/).
3. [Git](https://git-scm.com/downloads).
4. A free [Supabase](https://supabase.com/) account.

Verify in a new VS Code terminal:

```powershell
node --version
npm --version
git --version
```

## 1. Set up Supabase

1. Sign in to Supabase and create a new project.
2. Wait for the database to finish provisioning.
3. Open **SQL Editor** in the Supabase dashboard.
4. Open this project's `database/schema.sql`, copy all its contents into the SQL Editor, and run it.
5. Open **Table Editor** and confirm that `transactions` and `savings_goals` exist.
6. Open **Project Settings → API** (wording may vary). Copy the project URL and the server-side service-role/secret key. Never put that key in browser files or GitHub.

The schema enables Row Level Security and intentionally adds no anonymous policies. This starter backend uses a server-only service-role key, which bypasses RLS. That is why this local demo must not be exposed publicly without authentication and authorization.

## 2. Configure the backend

Open a terminal in the `backend` folder:

```powershell
cd path\to\budget-goal-planner\backend
npm install
```

Copy the example environment file to `.env`:

```powershell
Copy-Item .env.example .env
```

Edit `backend/.env` with your own values:

```dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_actual_server_only_key
```

- `PORT`: local web server port.
- `NODE_ENV`: environment name.
- `SUPABASE_URL`: URL shown in your Supabase project settings.
- `SUPABASE_SERVICE_ROLE_KEY`: privileged server-side key. Keep it secret.

`.env.example` is a safe template and belongs in Git. `.env` contains your private credentials and must never be committed. The root and backend `.gitignore` files exclude it.

## 3. Start the application

From the `backend` folder:

```powershell
npm run dev
```

Expected terminal message:

```text
Budget Goal Planner running at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The health endpoint is [http://localhost:3000/api/health](http://localhost:3000/api/health) and should return JSON with `"status":"ok"`.

To stop the server, focus the terminal and press `Ctrl+C`.

## API reference

All responses are JSON except successful DELETE requests, which return HTTP 204 with no body.

| Method | Path | Purpose | Body / response |
|---|---|---|---|
| GET | `/api/health` | Health check | Returns `{ "status": "ok", "app": "Budget Goal Planner" }` |
| GET | `/api/transactions` | List transactions | Returns an array, newest dates first |
| POST | `/api/transactions` | Create transaction | JSON: `title`, `type`, `amount`, `category`, `date`, optional `notes`; returns 201 and the created item |
| PUT | `/api/transactions/:id` | Update transaction | Same JSON fields; returns updated item or 404 |
| DELETE | `/api/transactions/:id` | Delete transaction | Returns 204 or 404 |
| GET | `/api/goals` | List savings goals | Returns an array |
| POST | `/api/goals` | Create goal | JSON: `title`, `target_amount`, `saved_amount`, optional `target_date`; returns 201 and the created goal |
| POST | `/api/goals/:id/contributions` | Add to a goal | JSON: `amount`; returns updated goal, 400 if contribution exceeds target, or 404 if missing |
| DELETE | `/api/goals/:id` | Delete goal | Returns 204 or 404 |

Authentication: none in this local demo. Validation failures return HTTP 400 with an `error` message; missing records return 404; unexpected server/database failures return a generic HTTP 500 message while technical details are logged only in the server terminal.

## Try the application

1. Add an income transaction (for example, `Allowance`, category `Allowance`).
2. Add an expense (for example, `Lunch`, category `Food`).
3. Confirm the dashboard totals update.
4. Use search and the type filter to find transactions.
5. Edit a transaction using the pencil icon; delete it using the × icon.
6. Create a goal (for example, `Headphones`) and set a target.
7. Use **Add savings** to record a contribution. A contribution that exceeds the remaining target is rejected.
8. Change the planning month to view another month's totals.

## Manual testing checklist

- [ ] `/api/health` returns status `ok`.
- [ ] A valid income transaction is saved and appears in the table.
- [ ] A valid expense updates expense totals.
- [ ] Editing a transaction changes its stored values.
- [ ] Deleting a transaction removes it.
- [ ] Search and type filter narrow the list.
- [ ] Empty title and zero/negative amount are rejected with a helpful message.
- [ ] Invalid transaction type or date is rejected by the backend.
- [ ] A valid savings goal is created and persists after a page refresh.
- [ ] A contribution increases saved amount.
- [ ] A contribution above the remaining target is rejected.
- [ ] Deleting a goal removes it.
- [ ] Layout works at desktop and mobile widths.
- [ ] If Supabase credentials are incorrect, the page shows an error and the terminal has diagnostic information.

## Troubleshooting

**`Missing SUPABASE_URL...`** — Ensure `backend/.env` exists and both values are correct, then restart the server.

**`Invalid API key` / database errors** — Copy the correct project URL and server-side key from the same Supabase project. Do not paste secrets into chat or GitHub.

**`relation does not exist`** — Run all of `database/schema.sql` in the correct project's SQL Editor and confirm the two tables exist.

**Page does not load** — Make sure the server is running and open `http://localhost:3000`, not the HTML file directly.

**Port already in use** — Change `PORT` in `backend/.env` to `3001`, restart the server, and visit `http://localhost:3001`.

**Data does not appear** — Check the terminal for errors and confirm the `.env` values match the project where you ran the SQL.

## Security notes and limitations

- The service-role key bypasses Row Level Security. It is only used in `backend/supabase.js` and must remain private.
- This MVP has no login, user accounts, or record ownership. Anyone who can reach the server can access or change the shared demo data.
- Keep this app local for demonstration. Before deployment, implement authentication, server-verified identity, per-user ownership checks, rate limiting, and suitable RLS policies.
- Do not commit real `.env` files, `node_modules`, database credentials, or private exports.
- The UI uses text nodes for user-provided content to avoid inserting untrusted content as HTML.

## GitHub upload

Create an empty repository on GitHub, then run these commands from the **root** `budget-goal-planner` folder. Replace the repository URL with your own:

```bash
git init
git status
git add .
git status
git commit -m "Build Budget Goal Planner"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Before committing, check that `backend/.env` is not listed by `git status` and that `.env.example` is included. If a secret was committed, `.gitignore` does not remove it from history: rotate the key immediately and clean the repository history.

## Future improvements

- Add Supabase Auth and user-specific transaction/goal ownership.
- Add category-wise charts and exportable monthly reports.
- Add recurring expenses and monthly spending limits.
- Add automated API tests and deployment configuration.
#   B U D G E T - G O A L - P L A N N E R  
 