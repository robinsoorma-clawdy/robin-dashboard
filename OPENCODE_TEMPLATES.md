# OpenCode Prompt Templates for robin-dashboard

## 1. React Component (UI)

```
Add [COMPONENT_NAME] component to [FILE_PATH].

Requirements:
- Use existing patterns from components/TaskColumn.tsx
- Style with CSS variables (var(--bg-primary), var(--accent), etc.)
- Add TypeScript interface for props
- Support dark theme (GitHub dark style)
- Add hover/focus states
- Ensure mobile responsive
- Follow component structure: interface → component → styles

Test that it renders without errors.
```

## 2. Supabase Database + Integration

```
Create [TABLE_NAME] table for [FEATURE].

Requirements:
- Create SQL migration in [TABLE_NAME]_table.sql
- Fields: id (uuid), created_at, updated_at, [CUSTOM_FIELDS]
- Enable RLS with policies for all operations
- Create TypeScript type in lib/types.ts
- Create helper functions in lib/[NAME].ts (create, read, update, delete)
- Add real-time subscription in [COMPONENT].tsx
- Log activity when [EVENTS] happen using lib/activity.ts

Test that CRUD operations work with Supabase.
```

## 3. Feature Integration (Complex)

```
Implement [FEATURE] in the dashboard.

Requirements:
- [SPECIFIC_BEHAVIOR_1]
- [SPECIFIC_BEHAVIOR_2]
- [SPECIFIC_BEHAVIOR_3]

Files to modify:
- [FILE_1]: [WHAT_TO_DO]
- [FILE_2]: [WHAT_TO_DO]

Follow existing patterns from similar features.
Add error handling and loading states.
Ensure real-time updates work.
Test the full user flow.
```

## 4. Bug Fix

```
Fix: [BUG_DESCRIPTION]

Issue: [WHAT_IS_BROKEN]
Expected: [WHAT_SHOULD_HAPPEN]
Actual: [WHAT_CURRENTLY_HAPPENS]

File: [FILE_PATH]
Fix approach: [TECHNICAL_APPROACH]
Test: Verify the fix works by [TEST_STEPS]
```

## 5. Styling/Polish

```
Update styling for [COMPONENT/FEATURE].

Requirements:
- Use CSS variables from app/globals.css
- Ensure consistent spacing (use existing patterns)
- Add smooth transitions (0.2s ease)
- Mobile-first responsive design
- Dark theme only (GitHub dark aesthetic)
- Test on mobile viewport
```

## Usage

1. Copy the relevant template
2. Replace [BRACKETS] with actual values
3. Spawn OpenCode:
   ```
   opencode run "[PROMPT]" -m google/antigravity-[MODEL] --agent build
   ```
4. Monitor and commit WIP at 2-3 min mark
5. Ping user when complete

## Model Selection Guide

| Task Type | Model | Why |
|-----------|-------|-----|
| UI component, styling | gemini-3-flash | Fast, 2-3 mins |
| Database + integration | claude-opus-4-6 | Thorough, handles edge cases |
| Complex multi-file feature | claude-opus-4-6 | Better architecture |
| Bug fix | gemini-3-flash | Quick iteration |
| Polish/refinement | gemini-3-flash | Fast feedback loop |
