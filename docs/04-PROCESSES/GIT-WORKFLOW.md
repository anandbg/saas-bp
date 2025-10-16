# Git Workflow Guide

**Project**: Radiology Reporting App Migration
**Last Updated**: January 2025
**Status**: Active

---

## 📋 Overview

This document defines the Git workflow for the Radiology Reporting App migration project. **All developers and agents MUST follow this workflow** to ensure proper version control, code review, and collaboration.

---

## 🎯 Core Principles

1. **Never commit directly to main/master** - Always use feature branches
2. **Every feature = One branch** - Keep branches focused and short-lived
3. **Commit at validation gates** - Commit after passing each handoff gate
4. **Conventional commits** - Use standardized commit message format
5. **No secrets in Git** - Git hooks will prevent committing credentials
6. **Atomic commits** - Each commit should represent one logical change

---

## 🌿 Branch Strategy

### Branch Naming Convention

```
feature/[phase].[feature-number]-[short-description]
```

**Examples:**
- `feature/1.1-project-setup`
- `feature/1.4-supabase-authentication`
- `feature/2.2-audio-transcription`
- `feature/3.2-chatkit-widget`

### Branch Types

| Type | Naming | Purpose | Lifetime |
|------|--------|---------|----------|
| **main/master** | `master` | Production-ready code | Permanent |
| **feature** | `feature/*` | New features | < 1 week |
| **bugfix** | `bugfix/*` | Bug fixes | < 2 days |
| **hotfix** | `hotfix/*` | Critical production fixes | < 1 day |
| **docs** | `docs/*` | Documentation only | < 1 day |

---

## 🔄 Feature Development Workflow

### Step 1: Create Feature Branch

Before starting any feature:

```bash
# Ensure you're on master and it's up to date
git checkout master
git pull origin master

# Create feature branch
git checkout -b feature/X.Y-feature-name

# Example:
git checkout -b feature/1.3-supabase-integration
```

### Step 2: Work on Feature

Commit at validation gates (see workflow stages below):

```bash
# Stage relevant files
git add [files]

# Commit with conventional format
git commit -m "type(scope): description"

# Examples:
git commit -m "feat(database): Create Supabase schema with RLS policies"
git commit -m "feat(auth): Implement Supabase authentication middleware"
git commit -m "test(auth): Add unit tests for authentication flow"
```

### Step 3: Push to Remote

```bash
# Push branch to remote
git push origin feature/X.Y-feature-name

# If branch already exists and you need to update
git push origin feature/X.Y-feature-name --force-with-lease
```

### Step 4: Create Pull Request

```bash
# Using GitHub CLI (recommended)
gh pr create \
  --title "Feature X.Y: Feature Name" \
  --body "$(cat <<'EOF'
## Summary
- Bullet point summary of changes
- Key features implemented
- Tests added

## Validation Gates Passed
- [x] Requirements validation
- [x] Design validation
- [x] Implementation validation
- [x] Testing validation

## Testing
- All tests passing (npm run test)
- Coverage: XX%
- Manual testing completed

## Related Issues
Closes #issue-number

🤖 Generated with Claude Code
EOF
)"

# Or manually create PR via GitHub web interface
```

### Step 5: Code Review & Merge

1. **Self-review** - Review your own PR first
2. **Automated checks** - Ensure CI/CD passes
3. **Peer review** - Request review from team/user
4. **Address feedback** - Make requested changes
5. **Merge** - Merge when approved

```bash
# Merge via GitHub CLI
gh pr merge --squash --delete-branch

# Or merge via GitHub web interface
```

---

## 📝 Commit Message Format

### Conventional Commits Standard

All commits MUST follow this format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| **feat** | New feature | `feat(transcription): Add Whisper API integration` |
| **fix** | Bug fix | `fix(auth): Resolve JWT expiration handling` |
| **docs** | Documentation | `docs: Update Git workflow guide` |
| **style** | Code formatting | `style(ui): Format component with Prettier` |
| **refactor** | Code refactoring | `refactor(api): Extract validation logic` |
| **test** | Tests | `test(reports): Add unit tests for generation` |
| **chore** | Maintenance | `chore: Update dependencies` |
| **perf** | Performance | `perf(db): Optimize report query with indexes` |
| **ci** | CI/CD | `ci: Add GitHub Actions workflow` |
| **build** | Build system | `build: Configure Vercel deployment` |

### Scope (Optional but Recommended)

Scopes indicate which part of the codebase is affected:

- `auth` - Authentication
- `database` - Database/Supabase
- `api` - API routes
- `ui` - User interface
- `transcription` - Audio transcription
- `reports` - Report generation
- `templates` - Template management
- `billing` - Stripe billing
- `tests` - Testing infrastructure

### Subject Rules

- Use imperative mood ("Add feature" not "Added feature")
- Lowercase first letter (handled by hook)
- No period at the end
- At least 10 characters
- Describe WHAT and WHY, not HOW

### Examples

**Good Commits:**
```bash
feat(database): Create subscriptions table with RLS policies
fix(api): Handle OpenAI rate limiting with exponential backoff
docs(workflow): Document Git branching strategy
test(transcription): Add tests for spoken punctuation conversion
chore: Initialize Next.js 14 project with TypeScript
refactor(reports): Extract contradiction cleaning into separate function
```

**Bad Commits:**
```bash
fix bug                          # Too short, not descriptive
updated files                    # Vague, no type
Added new feature for users      # Wrong tense, not descriptive enough
WIP                              # Not descriptive at all
asdfasdf                         # Meaningless
```

---

## 🚦 Commit at Validation Gates

Align commits with workflow validation gates:

### Gate 1: Requirements Approved → Commit

```bash
git add specs/features/[feature]/SPEC.md
git add specs/features/[feature]/ACCEPTANCE.md
git commit -m "docs(specs): Add requirements for Feature X.Y"
```

### Gate 2: Design Approved → Commit

```bash
git add specs/features/[feature]/DESIGN.md
git add docs/02-DESIGN/  # If architectural changes
git commit -m "docs(design): Add technical design for Feature X.Y"
```

### Gate 3: Implementation Complete → Commit

```bash
git add app/ components/ lib/  # Add implemented code
git commit -m "feat(feature): Implement Feature X.Y

- Backend API routes implemented
- Frontend components created
- TypeScript types defined
- Integration tests added"
```

### Gate 4: Tests Pass → Commit

```bash
git add tests/
git add specs/features/[feature]/TEST.md
git commit -m "test(feature): Add comprehensive test suite for Feature X.Y

- Unit tests: 95% coverage
- Integration tests: All passing
- E2E tests: Critical workflows validated"
```

### Gate 5: Feature Complete → Commit & Tag

```bash
git add docs/03-IMPLEMENTATION/STATUS.md
git commit -m "chore: Complete Feature X.Y

- All validation gates passed
- Documentation updated
- Feature ready for deployment"

# Optional: Tag major milestones
git tag -a phase-1-complete -m "Phase 1: Foundation Complete"
```

---

## 🔒 Git Hooks

### Pre-commit Hook

Prevents committing sensitive files:
- Blocks `credentials.env`, `.env`, etc.
- Blocks files with API keys, secrets, tokens
- Scans for hardcoded credentials

**Location:** `.git/hooks/pre-commit`

### Commit-msg Hook

Validates commit messages:
- Enforces conventional commit format
- Checks minimum subject length (10 chars)
- Allows merge and revert commits

**Location:** `.git/hooks/commit-msg`

### Testing Hooks

```bash
# Test commit-msg hook
echo "bad commit" | git commit --no-verify -m "$(cat)"
# Should fail

git commit -m "feat(test): Valid commit message for testing"
# Should succeed

# Test pre-commit hook
echo "api_key=secret123" > test.txt
git add test.txt
git commit -m "test: Testing pre-commit hook"
# Should fail
```

---

## 🚫 What NOT to Commit

### NEVER Commit:

- ❌ `credentials.env` or any `.env*` files (except `.env.template`)
- ❌ API keys, secrets, tokens, passwords
- ❌ Private keys (`.pem`, `.key`, `.p12`)
- ❌ `node_modules/`
- ❌ `.next/`, `out/`, `build/`, `dist/`
- ❌ Personal IDE settings (`.vscode/`, `.idea/`)
- ❌ Log files (`*.log`)
- ❌ Database files (`*.sqlite`, `*.db`)
- ❌ Large binary files (use Git LFS if needed)

### ALWAYS Commit:

- ✅ Source code (`.ts`, `.tsx`, `.js`)
- ✅ Configuration templates (`.env.template`)
- ✅ Documentation (`.md`)
- ✅ Tests (`*.test.ts`, `*.spec.ts`)
- ✅ Package manifests (`package.json`, `package-lock.json`)
- ✅ Database migrations (`supabase/migrations/*.sql`)
- ✅ Build configs (`next.config.js`, `tsconfig.json`)

---

## 📊 Git Status Checks

### Before Starting Work

```bash
# Check current branch
git branch --show-current

# Check status
git status

# Pull latest changes
git pull origin master

# Verify no uncommitted changes
git diff
```

### During Work

```bash
# Check what files changed
git status

# Review changes before committing
git diff

# Stage specific files
git add [file1] [file2]

# Or stage all changes
git add .

# Review staged changes
git diff --cached
```

### After Work

```bash
# Check all commits on branch
git log --oneline

# Check difference from master
git diff master

# Ensure branch is pushed
git push origin [branch-name]
```

---

## 🔄 Common Scenarios

### Scenario 1: Starting a New Feature

```bash
# 1. Get latest master
git checkout master
git pull origin master

# 2. Create feature branch
git checkout -b feature/2.3-report-generation

# 3. Start working...
```

### Scenario 2: Committing Progress

```bash
# 1. Check what changed
git status

# 2. Review changes
git diff

# 3. Stage files
git add [files]

# 4. Commit with conventional format
git commit -m "feat(reports): Implement espresso mode generation"

# 5. Push to remote
git push origin feature/2.3-report-generation
```

### Scenario 3: Updating Branch with Master Changes

```bash
# 1. Save current work
git add .
git commit -m "wip: Save current progress"

# 2. Get latest master
git checkout master
git pull origin master

# 3. Go back to feature branch
git checkout feature/2.3-report-generation

# 4. Rebase on master
git rebase master

# 5. If conflicts, resolve and continue
git status
# Fix conflicts
git add [resolved-files]
git rebase --continue

# 6. Force push (after rebase)
git push origin feature/2.3-report-generation --force-with-lease
```

### Scenario 4: Fixing Commit Message

```bash
# Fix last commit message
git commit --amend -m "fix(auth): Correct typo in commit message"

# If already pushed
git push origin feature/branch --force-with-lease
```

### Scenario 5: Splitting Large Changes

```bash
# Stage files incrementally
git add app/api/generate/route.ts
git commit -m "feat(api): Add report generation endpoint"

git add lib/ai/report-generator.ts
git commit -m "feat(ai): Implement report generation logic"

git add tests/unit/report-generator.test.ts
git commit -m "test(ai): Add tests for report generator"
```

---

## 📋 Agent-Specific Guidelines

### For All Agents

1. **Check Git status** before starting work
2. **Create feature branch** at start of feature
3. **Commit at validation gates** using conventional format
4. **Push regularly** to avoid losing work
5. **Update STATUS.md** in same commit as feature completion

### For Project Manager Agent

- Create feature branches for new features
- Review and merge PRs after validation
- Tag releases at phase completions
- Update STATUS.md after each feature

### For Implementation Agents (Frontend/Backend)

- Work on assigned feature branch
- Commit after each validation gate passes
- Write descriptive commit messages
- Push regularly to backup work

### For Tester Agent

- Add test commits to feature branch
- Commit test suite when complete
- Document test results in TEST.md
- Include coverage reports in commits

---

## 🎯 Git Workflow Checklist

Before considering a feature complete:

- [ ] Feature branch created from latest master
- [ ] All changes committed with conventional format
- [ ] All commits pushed to remote
- [ ] Pull request created with descriptive summary
- [ ] All validation gates passed and committed
- [ ] STATUS.md updated in final commit
- [ ] No merge conflicts with master
- [ ] CI/CD checks passing
- [ ] PR approved and ready to merge

---

## 🚨 Troubleshooting

### Problem: Commit Message Rejected

**Error:** `❌ ERROR: Invalid commit message format`

**Solution:**
```bash
# Use conventional commit format
git commit -m "feat(scope): descriptive message at least 10 chars"
```

### Problem: Pre-commit Hook Blocks Commit

**Error:** `❌ ERROR: Attempting to commit forbidden file`

**Solution:**
```bash
# Remove sensitive file from staging
git reset HEAD credentials.env

# Add to .gitignore if not already
echo "credentials.env" >> .gitignore
```

### Problem: Forgot to Create Feature Branch

**Solution:**
```bash
# Create branch from current commit
git checkout -b feature/X.Y-feature-name

# Push to remote
git push origin feature/X.Y-feature-name
```

### Problem: Committed to Master by Mistake

**Solution:**
```bash
# Create feature branch from current commit
git checkout -b feature/X.Y-feature-name

# Go back to master
git checkout master

# Reset master to remote
git reset --hard origin/master

# Switch back to feature branch
git checkout feature/X.Y-feature-name
```

---

## 📚 Additional Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Git Branching Best Practices](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Writing Good Commit Messages](https://chris.beams.io/posts/git-commit/)

---

## 🔄 Workflow Review

This workflow should be reviewed and updated:
- After each project phase
- When process improvements are identified
- When team composition changes
- When Git practices evolve

**Last Reviewed:** January 2025
**Next Review:** After Phase 1 Completion

---

**Questions or Issues?**
- Check this document first
- Review `.git/hooks/` for hook implementations
- Consult with Project Manager Agent
- Update this document if gaps are found

---

**Remember:** Good Git practices prevent data loss, enable collaboration, and create a clear project history. When in doubt, commit more frequently with clear messages!
