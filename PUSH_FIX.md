# Fix GitHub push (408 timeout + smaller repo + secrets)

---

## If GitHub blocked push: "Push cannot contain secrets" (API key in app_openai.py)

The hardcoded API key was removed from `app_openai.py`. The key must also be removed from **Git history**, or GitHub will keep blocking.

### Option A – One clean commit (Command Prompt)

Run these in **Command Prompt** (`cmd`) from `C:\Users\user\Desktop\NutriMedAI`. No PowerShell or `$(...)` needed.

**Step 1 – New branch with no history (one clean commit):**
```cmd
git checkout --orphan temp
```

**Step 2 – Stage all current files:**
```cmd
git add .
```

**Step 3 – Create the single commit:**
```cmd
git commit -m "Initial commit: NutriMedAI (React + FastAPI)"
```

**Step 4 – Replace main with this clean history:**
```cmd
git branch -D main
git branch -m main
```

**Step 5 – Push (force, because history changed):**
```cmd
git push -u origin main --force
```

### Option B – Allow the secret once on GitHub (not recommended)

You can use the “allow secret” link GitHub showed, but the key would remain in the repo history and is considered exposed. Prefer Option A.

---

# Fix GitHub push (408 timeout + smaller repo) – Command Prompt

## What happened
- Authentication as **Prissol** worked.
- Push failed with **HTTP 408** (timeout) while sending ~23 MB.
- Likely cause: **frontend/node_modules** was committed (thousands of files). It is now in `.gitignore`.

Run these in **Command Prompt** from `C:\Users\user\Desktop\NutriMedAI`:

## Step 1: Remove node_modules from Git (keep folder on disk)

```cmd
git rm -r --cached frontend/node_modules
```

If you get "did not match any files", node_modules was not committed; skip to Step 3.

## Step 2: Commit the change

```cmd
git add .gitignore
git commit -m "Stop tracking node_modules, add to .gitignore"
```

## Step 3: Increase Git HTTP buffer (avoids timeout on large pushes)

```cmd
git config http.postBuffer 524288000
```

## Step 4: Push again

```cmd
git push -u origin main
```

---

**If push still times out:** Try again; slow networks may need a few attempts. Or push in a new terminal with a stable connection.

**After push:** Anyone who clones the repo runs `npm install` in the `frontend` folder to get dependencies—that’s normal for Node projects.
