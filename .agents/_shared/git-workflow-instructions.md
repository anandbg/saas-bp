# Git Workflow Instructions for All Agents

**THIS SECTION MUST BE INCLUDED IN ALL AGENT INSTRUCTIONS**

---

## 🔄 Git Workflow (MANDATORY)

### Core Requirement

**ALL code changes MUST be version controlled using Git.**

You MUST follow the Git workflow defined in `docs/04-PROCESSES/GIT-WORKFLOW.md`.

---

### Git Workflow Overview

#### 1. Before Starting Work

```bash
# Check current status
git status

# Ensure on correct branch or create new one
git checkout -b feature/X.Y-feature-name

# Example:
git checkout -b feature/1.3-supabase-integration
```

#### 2. During Development

Commit at each validation gate passage:

| Gate | Commit Type | Example |
|------|-------------|---------|
| Requirements Approved | `docs(specs)` | `docs(specs): Add requirements for Feature 1.3` |
| Design Approved | `docs(design)` | `docs(design): Add technical design for Feature 1.3` |
| Implementation Complete | `feat(scope)` | `feat(database): Implement Supabase integration` |
| Tests Complete | `test(scope)` | `test(database): Add tests for Supabase client` |
| Feature Complete | `chore` | `chore: Complete Feature 1.3 - Supabase Integration` |

#### 3. Commit Message Format

**REQUIRED FORMAT** (enforced by Git hook):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance
- `perf`: Performance
- `ci`: CI/CD
- `build`: Build system

**Requirements:**
- Subject must be at least 10 characters
- Use imperative mood ("Add feature" not "Added feature")
- Lowercase first letter (after type)
- No period at end of subject

**Examples:**
```bash
feat(auth): Implement Supabase authentication middleware
fix(api): Handle OpenAI rate limiting with exponential backoff
docs(workflow): Update Git branching strategy
test(transcription): Add unit tests for spoken punctuation
chore(deps): Update Next.js to version 14.2.0
refactor(reports): Extract generation logic into separate service
```

#### 4. Committing Changes

```bash
# Stage relevant files
git add [files]

# Or stage all changes
git add .

# Commit with conventional format
git commit -m "type(scope): description of at least 10 characters"

# Push to remote regularly
git push origin feature/X.Y-feature-name
```

#### 5. When Feature Complete

```bash
# Ensure all changes committed
git status

# Push final changes
git push origin feature/X.Y-feature-name

# Create pull request
gh pr create \
  --title "Feature X.Y: Feature Name" \
  --body "Summary of changes..."
```

---

### Git Hooks (Automatic Validation)

Two hooks are configured to enforce quality:

#### Pre-commit Hook
- **Blocks** committing `credentials.env`, `.env`, etc.
- **Blocks** files with API keys, secrets, tokens
- **Scans** for hardcoded credentials

#### Commit-msg Hook
- **Validates** conventional commit format
- **Checks** minimum subject length (10 chars)
- **Allows** merge and revert commits

**If your commit is blocked**, the hook will show exactly what's wrong and how to fix it.

---

### What NOT to Commit

**NEVER commit:**
- ❌ `credentials.env` or any `.env*` files (except templates)
- ❌ API keys, secrets, tokens, passwords
- ❌ Private keys (`.pem`, `.key`, `.p12`)
- ❌ `node_modules/`
- ❌ `.next/`, `out/`, `build/`, `dist/`
- ❌ Log files (`*.log`)
- ❌ Personal IDE settings (`.vscode/`, `.idea/`)

**ALWAYS commit:**
- ✅ Source code (`.ts`, `.tsx`, `.js`, `.jsx`)
- ✅ Configuration templates (`.env.template`)
- ✅ Documentation (`.md`)
- ✅ Tests (`*.test.ts`, `*.spec.ts`)
- ✅ Package files (`package.json`, `package-lock.json`)
- ✅ Database migrations (`supabase/migrations/*.sql`)

---

### Common Git Commands

```bash
# Check what changed
git status

# Review changes before committing
git diff

# Review staged changes
git diff --cached

# Check commit history
git log --oneline

# Update from master
git checkout master
git pull origin master
git checkout feature/X.Y-feature-name
git rebase master
```

---

### When You Encounter Issues

#### Issue: Commit Message Rejected

```bash
# Error: Invalid commit message format
# Fix: Use conventional commit format
git commit -m "feat(auth): Add user authentication at least 10 chars"
```

#### Issue: Pre-commit Hook Blocks

```bash
# Error: Attempting to commit forbidden file
# Fix: Remove from staging
git reset HEAD credentials.env
```

#### Issue: Forgot to Create Branch

```bash
# Fix: Create branch from current commit
git checkout -b feature/X.Y-feature-name
```

---

### Agent-Specific Responsibilities

#### Project Manager Agent
- Create feature branches for new features
- Review PRs after validation gates
- Merge approved PRs
- Tag releases at phase completions
- Update STATUS.md in commits

#### Frontend Engineer Agent
- Work on feature branch
- Commit after UI implementation milestones
- Include component tests in commits
- Push regularly

#### Backend Engineer Agent
- Work on feature branch
- Commit after API implementation milestones
- Include unit/integration tests in commits
- Push regularly

---

### Validation Checklist

Before considering work complete:

- [ ] Created feature branch from master
- [ ] All changes committed with conventional format
- [ ] Commit messages are descriptive and clear
- [ ] No credentials or sensitive data committed
- [ ] All commits pushed to remote
- [ ] STATUS.md updated (if applicable)
- [ ] PR created (when feature complete)

---

### Quick Reference

| Action | Command |
|--------|---------|
| Create branch | `git checkout -b feature/X.Y-name` |
| Check status | `git status` |
| Stage files | `git add [files]` |
| Commit | `git commit -m "type(scope): subject"` |
| Push | `git push origin [branch-name]` |
| Create PR | `gh pr create --title "Title" --body "Body"` |

---

### Resources

- **Full Git Workflow**: `docs/04-PROCESSES/GIT-WORKFLOW.md`
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Project Guide**: `.claude/CLAUDE.md`

---

**Remember:** Git workflow is NOT optional. All agents MUST follow these practices to maintain code quality and project history.

---

**Last Updated**: January 2025
**Applies To**: All agents (Project Manager, Frontend Engineer, Backend Engineer, Tester, Designer, Requirements Analyst)
