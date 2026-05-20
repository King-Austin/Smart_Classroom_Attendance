```markdown
# Smart_Classroom_Attendance Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and workflows used in the `Smart_Classroom_Attendance` TypeScript codebase. It covers file naming, import/export conventions, test structure, and step-by-step guides for adding new React Native screens/components and updating Android CI workflows. This guide is ideal for contributors seeking to maintain consistency and efficiency in this project.

## Coding Conventions

### File Naming
- Use **PascalCase** for all file names.
  - Example: `AttendanceScreen.tsx`, `UserList.ts`

### Import Style
- Use **alias imports** for modules.
  - Example:
    ```typescript
    import { AttendanceList } from '@components/AttendanceList';
    import { useAuth } from '@hooks/useAuth';
    ```

### Export Style
- Use **named exports** rather than default exports.
  - Example:
    ```typescript
    // Good
    export function markAttendance() { ... }

    // Good
    export const UserList = () => { ... };

    // Avoid
    // export default UserList;
    ```

### Commit Messages
- Follow **Conventional Commits** style.
  - Prefixes: `feat`, `ci`
  - Example: `feat: add student attendance summary screen`

## Workflows

### Add or Update React Native Screen or Component
**Trigger:** When adding a new screen/component or porting one from the web app to the native app.  
**Command:** `/new-screen`

1. **Create or update** a file in `native/src/screens/` (for screens) or `native/src/components/` (for components).
2. **If it's a screen**, add a navigation entry in `native/src/navigation/` and update navigation types if needed.
3. **Update or create** associated hooks in `native/src/hooks/` if your screen/component needs custom logic.
4. **Update or create** supporting files such as types (`native/src/types/`), constants (`native/src/constants/`), or theme files as required.

**Example:**
```typescript
// native/src/screens/AttendanceScreen.tsx
import { useAttendance } from '@hooks/useAttendance';
import { AttendanceList } from '@components/AttendanceList';

export function AttendanceScreen() {
  const { records } = useAttendance();
  return <AttendanceList data={records} />;
}
```

### CI Android Build Workflow Update
**Trigger:** When setting up or modifying the Android build CI pipeline.  
**Command:** `/update-android-ci`

1. **Create or update** `.github/workflows/build-android.yml`.
2. **Change build steps** as needed (e.g., switch from EAS Build to Gradle, update GitHub Action versions).
3. **Adjust environment variables and secrets** in the workflow file as required.
4. **Document** any required secrets or build profiles for future contributors.

**Example:**
```yaml
# .github/workflows/build-android.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Build APK
        run: ./gradlew assembleRelease
      # Add or update steps as needed
```

## Testing Patterns

- **Test files** use the pattern `*.test.*` (e.g., `AttendanceScreen.test.tsx`).
- **Testing framework** is not explicitly detected; check existing test files for patterns.
- Place test files alongside the code they test or in a dedicated `__tests__` directory.

**Example:**
```typescript
// AttendanceScreen.test.tsx
import { render } from '@testing-library/react-native';
import { AttendanceScreen } from './AttendanceScreen';

test('renders attendance list', () => {
  const { getByText } = render(<AttendanceScreen />);
  expect(getByText('Attendance')).toBeTruthy();
});
```

## Commands

| Command           | Purpose                                                         |
|-------------------|-----------------------------------------------------------------|
| /new-screen       | Add or update a React Native screen or component                |
| /update-android-ci| Add or update the Android build CI workflow                     |
```
