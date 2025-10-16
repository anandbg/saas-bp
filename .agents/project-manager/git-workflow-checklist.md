# Git Workflow Validation Checklist

**For Project Manager Agent**

Use this checklist to validate that all agents are following the Git workflow properly.

---

## 📋 Pre-Feature Checklist

Before starting any new feature:

- [ ] Feature branch created from latest master
- [ ] Branch follows naming convention: `feature/X.Y-feature-name`
- [ ] All agents aware of the feature branch name
- [ ] No uncommitted changes on master

---

## 🔄 During Feature Development

### After Requirements Gate

- [ ] Requirements committed to branch
- [ ] Commit message follows format: `docs(specs): Add requirements for Feature X.Y`
- [ ] Files committed:
  - `specs/features/[feature]/SPEC.md`
  - `specs/features/[feature]/ACCEPTANCE.md`
- [ ] Commit pushed to remote

### After Design Gate

- [ ] Design committed to branch
- [ ] Commit message follows format: `docs(design): Add technical design for Feature X.Y`
- [ ] Files committed:
  - `specs/features/[feature]/DESIGN.md`
  - Any updates to `docs/02-DESIGN/*`
- [ ] Commit pushed to remote

### After Implementation Gate

- [ ] Implementation committed to branch
- [ ] Commit message follows format: `feat(scope): Implement Feature X.Y`
- [ ] Files committed:
  - All source code changes
  - Types, utilities, etc.
- [ ] Multiple commits allowed for large implementations
- [ ] All commits use conventional format
- [ ] All commits pushed to remote

### After Testing Gate

- [ ] Tests committed to branch
- [ ] Commit message follows format: `test(scope): Add test suite for Feature X.Y`
- [ ] Files committed:
  - All test files
  - `specs/features/[feature]/TEST.md`
- [ ] All tests passing
- [ ] Coverage metrics documented
- [ ] Commit pushed to remote

### After Feature Complete

- [ ] STATUS.md updated
- [ ] Final commit message: `chore: Complete Feature X.Y - Feature Name`
- [ ] Files committed:
  - `docs/03-IMPLEMENTATION/STATUS.md`
  - Any final cleanup
- [ ] All commits pushed to remote
- [ ] Branch ready for PR

---

## 📝 Commit Message Validation

For each commit, verify:

- [ ] Follows conventional format: `<type>(<scope>): <subject>`
- [ ] Type is valid: feat, fix, docs, style, refactor, test, chore, perf, ci, build
- [ ] Scope is relevant and descriptive
- [ ] Subject is at least 10 characters
- [ ] Subject uses imperative mood ("Add" not "Added")
- [ ] Subject is clear and descriptive
- [ ] No period at end of subject

### Examples of Good Commits

```bash
✅ feat(database): Create Supabase schema with RLS policies
✅ feat(api): Add report generation endpoint with validation
✅ feat(transcription): Implement spoken punctuation conversion
✅ docs(design): Add technical design for audio transcription
✅ test(api): Add integration tests for /api/generate
✅ chore: Complete Feature 1.3 - Supabase Integration
```

### Examples of Bad Commits

```bash
❌ fix bug                                    # Too short, no scope
❌ updated files                               # No type, vague
❌ Added new feature for users                 # Wrong tense
❌ WIP                                         # Not descriptive
❌ feat(api): add endpoint                     # Subject too short (< 10 chars)
```

---

## 🚫 Security Validation

Before allowing any commit, ensure:

- [ ] No credentials committed (`.env`, `credentials.env`, etc.)
- [ ] No API keys or secrets in code
- [ ] No hardcoded passwords or tokens
- [ ] `.gitignore` properly configured
- [ ] Pre-commit hook is active and working
- [ ] No sensitive data in commit messages

**Git hooks will catch these automatically, but double-check!**

---

## 📊 Pull Request Validation

When feature is complete and ready for PR:

- [ ] All commits follow conventional format
- [ ] Git log is clean and readable
- [ ] No merge conflicts with master
- [ ] All validation gates passed
- [ ] STATUS.md updated
- [ ] All tests passing
- [ ] All commits pushed to remote

### PR Creation Checklist

- [ ] PR title follows format: `Feature X.Y: Feature Name`
- [ ] PR body includes:
  - Summary of changes
  - Validation gates passed
  - Testing performed
  - Related issues
- [ ] PR linked to any related issues
- [ ] CI/CD checks passing
- [ ] Ready for review

---

## 🔍 Agent Compliance Monitoring

Periodically check that all agents are following Git workflow:

### Backend Engineer

- [ ] Creating commits for API routes
- [ ] Creating commits for business logic
- [ ] Creating commits for database migrations
- [ ] Using appropriate commit types (feat, refactor, test)
- [ ] Pushing regularly

### Frontend Engineer

- [ ] Creating commits for components
- [ ] Creating commits for pages
- [ ] Creating commits for hooks
- [ ] Using appropriate commit types (feat, style, refactor)
- [ ] Pushing regularly

### All Agents

- [ ] Working on correct feature branch
- [ ] Not committing directly to master
- [ ] Following conventional commit format
- [ ] Committing at validation gates
- [ ] Pushing after each commit
- [ ] Not committing sensitive data

---

## 🚨 Common Issues and Resolutions

### Issue: Agent Forgot to Create Branch

**Detection**: Commits on master instead of feature branch

**Resolution**:
```bash
# Create branch from current commit
git branch feature/X.Y-feature-name

# Move master back
git checkout master
git reset --hard origin/master

# Continue on feature branch
git checkout feature/X.Y-feature-name
```

### Issue: Agent Used Wrong Commit Format

**Detection**: Commit message doesn't follow conventional format

**Resolution**:
```bash
# Amend last commit message
git commit --amend -m "feat(scope): Correct commit message format"

# Force push (if already pushed)
git push origin feature/X.Y-feature-name --force-with-lease
```

### Issue: Agent Committed Sensitive Data

**Detection**: Pre-commit hook blocked or credentials in history

**Resolution**:
```bash
# Remove from staging (if caught before commit)
git reset HEAD credentials.env

# If already committed, must rewrite history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch credentials.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (DANGEROUS - use with caution)
git push origin --force --all
```

**Prevention**: Git hooks should catch this automatically

### Issue: Multiple Agents Working on Same Files

**Detection**: Merge conflicts when pulling

**Resolution**:
```bash
# Pull latest changes
git pull origin feature/X.Y-feature-name

# Resolve conflicts in files
# Edit files to resolve conflicts

# Stage resolved files
git add [resolved-files]

# Complete merge
git commit -m "chore: Resolve merge conflicts"

# Push
git push origin feature/X.Y-feature-name
```

---

## 📈 Metrics to Track

Monitor these metrics over time:

- **Commit Quality**: % of commits following conventional format
- **Branch Hygiene**: # of commits on master vs feature branches
- **Push Frequency**: Average time between commits and pushes
- **PR Quality**: # of PR rejections due to git issues
- **Security Incidents**: # of times sensitive data was committed

**Target**:
- 100% commits follow conventional format
- 0 commits directly to master
- < 1 hour between commit and push
- 0 PRs rejected for git issues
- 0 security incidents

---

## ✅ Feature Completion Validation

Before marking feature complete and merging PR:

### Git Workflow Complete

- [ ] All commits follow conventional format
- [ ] All commits pushed to remote
- [ ] Git history is clean and meaningful
- [ ] No merge conflicts
- [ ] Branch is up to date with master

### Documentation Complete

- [ ] STATUS.md updated
- [ ] All specs committed
- [ ] All design docs committed
- [ ] No uncommitted changes

### Quality Complete

- [ ] All validation gates passed
- [ ] All tests passing
- [ ] TypeScript compilation succeeds
- [ ] Linting passes
- [ ] No console errors

### Ready for Merge

- [ ] PR created
- [ ] PR approved
- [ ] CI/CD passing
- [ ] No blockers
- [ ] User approval (if required)

---

## 🔄 Continuous Improvement

After each feature completion:

- [ ] Review git log for quality
- [ ] Identify any workflow violations
- [ ] Document lessons learned
- [ ] Update this checklist if needed
- [ ] Share feedback with agents

---

**Last Updated**: January 2025
**Owner**: Project Manager Agent
**Purpose**: Ensure all agents follow Git workflow consistently
