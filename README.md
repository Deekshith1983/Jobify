# Jobify — Monorepo (Django backend + React frontend)

This repository contains a Django backend (`jobboard/`) and a React frontend (`frontend/`) in a single monorepo.

This interactive README walks you through: verifying the repository layout, preparing ignored files, initializing a single Git repo (so `frontend` is not treated as a separate Git repo), pushing to GitHub, and running both apps locally. All commands are for Windows PowerShell and should be run from the repository root (`C:\projects\jobBoard`).

Use the checkboxes below as a simple interactive checklist on GitHub.

## Quick status checklist

- [ ] Confirm `frontend` is not a nested Git repo
- [ ] Create/update root `.gitignore` (already present)
- [ ] Remove nested `frontend/.git` if you don't need its separate history
- [ ] Initialize root Git repo and commit
- [ ] Add remote and push to GitHub
- [ ] Verify files on GitHub

---

## 1) Project layout (what to expect)

Top-level structure (relevant folders):

- `jobboard/` — Django project and app(s)
- `frontend/` — React app created with create-react-app
- `media/` — local uploads (should be ignored)
- `db.sqlite3` — local SQLite database (should be ignored)

If you see a `.git` folder inside `frontend/`, treat `frontend` as a nested repo and follow the instructions below.

## 2) Check for nested git repo

From PowerShell in the repo root:

```powershell
Set-Location -Path 'C:\projects\jobBoard'

# Check if frontend has its own .git directory
if (Test-Path .\frontend\.git) { Write-Output 'frontend/.git exists — frontend is a nested repo' } else { Write-Output 'No frontend/.git found — frontend is not a nested repo' }
```

If the output says `frontend/.git exists` and you DO NOT want to keep the frontend history separately, remove the nested git directory (safe if you don't need the history):

```powershell
# Remove nested git metadata (this destroys the separate history, only do if you're sure)
Remove-Item -Recurse -Force .\frontend\.git
Write-Output 'Removed frontend/.git'
```

If you want to preserve frontend commit history, use a git subtree or submodule instead — see the Advanced section below.

## 3) Ensure root `.gitignore` is correct

The repo already has a root `.gitignore`. Important files to ignore for this monorepo include:

- `frontend/node_modules/` and `frontend/build/`
- `db.sqlite3` and `jobboard/db.sqlite3`
- `media/` and uploaded files
- `.env` files and other secret files

You can open and edit `\.gitignore` to customize it.

## 4) Initialize a single root git repository and commit (if not already done)

If you haven't initialized the repo at root yet, run:

```powershell
# initialize repository and create main branch
git init
git checkout -b main

# stage everything (root .gitignore prevents adding ignored files)
git add .

# if some unwanted files were tracked before, untrack them
git rm --cached -r frontend/node_modules 2>$null
git rm --cached jobboard/db.sqlite3 2>$null
git rm --cached -r media 2>$null

# commit
git commit -m "Initial commit: Django backend + React frontend"
```

If you already ran `git init` and committed, you can skip the above.

## 5) Add GitHub remote and push

Option A — create the repo on GitHub via web UI and push:

```powershell
# replace with your repo URL
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Option B — use GitHub CLI (if installed):

```powershell
gh repo create my-repo-name --public --source=. --remote=origin --push
```

After pushing, visit the repository page on GitHub to confirm files are present and ignored files are not.

## 6) Local run instructions (basic)

Backend (Django)

```powershell
# create and activate a virtual environment (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# install requirements
pip install -r jobboard/requirements.txt

# migrate and run
python jobboard/manage.py migrate
python jobboard/manage.py createsuperuser  # optional
python jobboard/manage.py runserver
```

Frontend (React)

```powershell
Set-Location -Path .\frontend
npm install
npm start
```

The frontend dev server (usually on http://localhost:3000) should proxy or consume the Django API depending on your configuration.

## 7) Create `.env.example` (recommended)

Create a file called `.env.example` listing the environment variables required (without secrets). Example:

```
# .env.example
DJANGO_SECRET_KEY=replace_me
DATABASE_URL=sqlite:///db.sqlite3
DEBUG=True
```

Add `.env` to `.gitignore` (already done) and create a local `.env` that contains real secrets.

## 8) Advanced: preserve frontend history (optional)

If you want to keep the `frontend` commit history that currently exists in `frontend/.git`, instead of deleting `frontend/.git`, use one of these approaches:

- Git subtree (recommended for monorepo consolidation):

```powershell
# from repo root (when frontend is a separate repo already pushed to remote)
git remote add frontend-remote https://github.com/YOUR_USERNAME/FRONTEND_REPO.git
git fetch frontend-remote
git subtree add --prefix=frontend frontend-remote/main --squash
```

- Git submodule (keeps it as a separate repo inside this repo):

```powershell
git submodule add https://github.com/YOUR_USERNAME/FRONTEND_REPO.git frontend
git submodule update --init --recursive
```

Submodules require extra steps for contributors; subtrees are easier if you want a single repo containing both histories.

## 9) Troubleshooting

- If an ignored file is already tracked, remove it from the index and commit the removal (`git rm --cached path`).
- If secrets were accidentally committed, DO NOT push. Use the BFG Repo-Cleaner or `git filter-repo` to remove secrets from history before pushing (I can help with that).
- If your pushes are rejected, run `git pull --rebase origin main` to reconcile, then push again.

## Live demo / Deployment

The React frontend for this project is deployed and available at:

https://jobboard-frontend-jj2h.onrender.com

Visit the link to see the live frontend. If the frontend communicates with the backend, ensure the backend API is reachable or replace API endpoints with production URLs as needed.


