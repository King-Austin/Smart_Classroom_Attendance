---
name: ci-android-build-workflow-update
description: Workflow command scaffold for ci-android-build-workflow-update in Smart_Classroom_Attendance.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /ci-android-build-workflow-update

Use this workflow when working on **ci-android-build-workflow-update** in `Smart_Classroom_Attendance`.

## Goal

Adds or updates the GitHub Actions workflow for building the Android APK, switching between EAS Build and local Gradle, and updating action versions.

## Common Files

- `.github/workflows/build-android.yml`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update .github/workflows/build-android.yml
- Change build steps (e.g., switch from EAS Build to Gradle, update action versions)
- Adjust environment variables and secrets as needed
- Document any required secrets or build profiles

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.