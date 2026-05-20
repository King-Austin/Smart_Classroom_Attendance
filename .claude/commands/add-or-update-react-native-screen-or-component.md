---
name: add-or-update-react-native-screen-or-component
description: Workflow command scaffold for add-or-update-react-native-screen-or-component in Smart_Classroom_Attendance.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-or-update-react-native-screen-or-component

Use this workflow when working on **add-or-update-react-native-screen-or-component** in `Smart_Classroom_Attendance`.

## Goal

Implements a new screen or component in the React Native (Expo) app, or updates an existing one, as part of feature development or migration.

## Common Files

- `native/src/screens/*.tsx`
- `native/src/components/**/*.tsx`
- `native/src/navigation/*.tsx`
- `native/src/hooks/*.ts`
- `native/src/types/*.ts`
- `native/src/constants/*.ts`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update a file in native/src/screens/ or native/src/components/
- If it's a screen, add navigation entry in native/src/navigation/ or update navigation types
- If needed, update or create associated hooks in native/src/hooks/
- Update or create supporting files (e.g., types, constants, theme) as required

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.