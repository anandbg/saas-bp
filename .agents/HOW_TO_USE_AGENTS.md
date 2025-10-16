# How to Use AI Agents in This Project

## Overview

This project is designed to work with **Claude Code's agent system**. Each agent in `.agents/` can be activated as an autonomous AI agent using Claude Code's Task tool.

---

## Activating Agents in Claude Code

### Method 1: Using Slash Commands (Recommended)

We need to create custom slash commands in `.claude/commands/`:

```bash
# These commands will activate specialized agents
/pm          # Project Manager (orchestrator)
/requirements # Requirements Analyst
/design      # Designer
/backend     # Backend Engineer
/frontend    # Frontend Engineer
/test        # Tester
```

### Method 2: Using Task Tool Directly

Claude Code can spawn agents using the Task tool:

```typescript
// Example: Delegate to backend engineer
Task({
  subagent_type: "backend-engineer",
  description: "Implement authentication API",
  prompt: `
    You are the Backend Engineer agent.

    Read your instructions: .agents/backend-engineer/instructions.md
    Read the task spec: specs/tasks/AUTH-001-api-implementation.md
    Read the design: specs/features/01-authentication/DESIGN.md

    Implement the /api/auth/login endpoint according to the specifications.

    Preserve critical business logic exactly as documented in constraints.

    When complete, return a summary of what was implemented.
  `
})
```

---

## Agent Types Available in Claude Code

Claude Code has several built-in agent types we can use:

1. **general-purpose** - General tasks, research, file operations
2. **kiro-requirement** - Requirements gathering (perfect for our Requirements Analyst!)
3. **kiro-design** - Design documentation (perfect for our Designer!)
4. **kiro-plan** - Implementation planning (perfect for our Project Manager!)
5. **kiro-executor** - Task execution (for Engineers!)
6. **backend-expert** - Python/backend (maps to our Backend Engineer)
7. **frontend-expert** - Frontend/UI (maps to our Frontend Engineer)
8. **code-reviewer** - Code review (maps to our Tester)

---

## Mapping Our Agents to Claude Code Agents

| Our Agent | Claude Code Agent Type | Usage |
|-----------|----------------------|-------|
| Project Manager | `kiro-plan` | Task planning, orchestration |
| Requirements Analyst | `kiro-requirement` | Requirements gathering |
| Designer | `kiro-design` | Technical design creation |
| Backend Engineer | `python-backend-expert` | Backend implementation |
| Frontend Engineer | `frontend-expert` | Frontend implementation |
| Tester | `code-reviewer` | Testing and validation |

---

## Creating Slash Commands

To make agents easily accessible, create these files:

### `.claude/commands/pm.md`
```markdown
You are the Project Manager agent for this project.

Your role: Orchestrate the development workflow with gated handoffs.

Instructions:
1. Read: .agents/project-manager/instructions.md
2. Read: docs/03-IMPLEMENTATION/STATUS.md
3. Read: docs/00-PROJECT/REQUIREMENTS.md
4. Follow the workflow in: workflows/feature-development.yaml

Current task: Coordinate the next feature implementation using specialized agents.

Use the kiro-plan subagent type for planning and task breakdown.
```

### `.claude/commands/backend.md`
```markdown
You are the Backend Engineer agent for this project.

Your role: Implement API routes, business logic, and database operations.

Instructions:
1. Read: .agents/backend-engineer/instructions.md
2. Read your assigned task in: specs/tasks/[TASK-ID].md
3. Read the feature design in: specs/features/[feature]/DESIGN.md
4. Implement according to specifications

CRITICAL: Preserve business logic exactly as documented in docs/00-PROJECT/CONSTRAINTS.md

Use the python-backend-expert subagent type for implementation.
```

### `.claude/commands/frontend.md`
```markdown
You are the Frontend Engineer agent for this project.

Your role: Implement UI components, pages, and client-side logic.

Instructions:
1. Read: .agents/frontend-engineer/instructions.md
2. Read your assigned task in: specs/tasks/[TASK-ID].md
3. Read the feature design in: specs/features/[feature]/DESIGN.md
4. Implement according to specifications

Use TypeScript strict mode and follow Next.js 14+ App Router patterns.

Use the frontend-expert subagent type for implementation.
```

---

## Example Workflow with Real AI Agents

### Scenario: Implement Authentication Feature

**Step 1: Activate Project Manager**
```bash
/pm
```

The PM agent will:
1. Read requirements
2. Create feature spec in `specs/features/01-authentication/`
3. Delegate to Requirements Analyst if needed
4. Validate requirements gate
5. Delegate to Designer

**Step 2: Designer Creates Design**
The PM delegates using Task tool:
```typescript
Task({
  subagent_type: "kiro-design",
  prompt: "Create technical design for authentication feature..."
})
```

Designer agent creates `specs/features/01-authentication/DESIGN.md`

**Step 3: PM Validates Design Gate**
PM checks handoff checklist

**Step 4: PM Delegates to Engineers**
```typescript
// Backend task
Task({
  subagent_type: "python-backend-expert",
  prompt: "Implement authentication API according to design..."
})

// Frontend task (parallel)
Task({
  subagent_type: "frontend-expert",
  prompt: "Implement login UI according to design..."
})
```

**Step 5: PM Delegates to Tester**
```typescript
Task({
  subagent_type: "code-reviewer",
  prompt: "Review authentication implementation and create tests..."
})
```

**Step 6: PM Updates Status**
PM updates `docs/03-IMPLEMENTATION/STATUS.md`

---

## Autonomous Agent Execution

With proper slash commands, you can run:

```bash
# Start autonomous feature development
/pm "Implement authentication feature from requirements"

# PM will autonomously:
# 1. Read requirements
# 2. Spawn Requirements Analyst agent (if needed)
# 3. Validate requirements gate
# 4. Spawn Designer agent
# 5. Validate design gate
# 6. Spawn Backend + Frontend agents in parallel
# 7. Validate implementation gate
# 8. Spawn Tester agent
# 9. Validate testing gate
# 10. Update STATUS.md
# 11. Report completion
```

---

## Why This Works Better Than OpenAI Agents SDK

### OpenAI Agents SDK Approach
```python
# Requires separate Python runtime
agent = Agent(name="backend", model="gpt-4")
result = agent.run("Implement auth API")
```

**Limitations**:
- Separate runtime environment
- No direct file system access
- No integration with Claude Code
- Must set up OpenAI API separately

### Claude Code Approach
```bash
/backend "Implement auth API"
```

**Benefits**:
- ✅ Native integration with Claude Code
- ✅ Direct file system access
- ✅ Access to all Claude Code tools
- ✅ Works in your current development environment
- ✅ No separate runtime needed
- ✅ Seamless handoffs between agents

---

## Setting Up for Autonomous Operation

### 1. Create Slash Commands
Create files in `.claude/commands/`:
- `pm.md`
- `requirements.md`
- `design.md`
- `backend.md`
- `frontend.md`
- `test.md`

### 2. Use Subagent Types
Always specify the appropriate `subagent_type` when using Task tool

### 3. Provide Complete Context
Each agent invocation should include:
- Link to agent instructions
- Link to task specification
- Link to relevant design documents
- Clear success criteria

---

## Next Steps

**To enable true AI agents in this project:**

1. **Create slash commands** in `.claude/commands/` for each agent
2. **Test with simple task**: `/pm "Review project status"`
3. **Validate workflow**: Ensure agents can access all needed files
4. **Iterate**: Refine agent prompts based on results

**Want me to create the slash command files now?**

---

## Reference

- Claude Code Documentation: `.claude/CLAUDE.md`
- Agent Instructions: `.agents/[agent]/instructions.md`
- Workflow Definition: `workflows/feature-development.yaml`
- Task Tool Usage: See Claude Code documentation

---

**Status**: Ready for slash command creation
**Next**: Create `.claude/commands/*.md` files to enable agent activation
