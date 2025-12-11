Now that you have the task group(s) to be implemented, proceed with implementation by following these instructions:

Implement all tasks assigned to you and ONLY those task(s) that have been assigned to you.

> Workflow commands presume the stack declared in `profiles/react-firebase/standards/global/tech-stack.md` (React Native CLI + Firebase tooling). Update that file first if those assumptions change.

## Implementation process:

1. Analyze the provided spec.md, requirements.md, and visuals (if any)
2. Spin up the Firebase Emulator Suite (Auth, Firestore, Storage, Functions) and run the React Native target (`yarn ios`, `yarn android`, or `yarn web`) to validate locally.
3. Analyze patterns in the codebase according to its built-in workflow (navigation stacks, Zustand stores, shared Zod schemas, Cloud Function helpers).
4. Implement the assigned task group according to requirements and standards, favoring existing primitives before adding new libraries.
5. Update `agent-os/specs/[this-spec]/tasks.md` to mark completed tasks with `- [x]`.

## Guide your implementation using:
- **The existing patterns** that you've found and analyzed in the codebase.
- **Specific notes provided in requirements.md, spec.md AND/OR tasks.md**
- **Visuals provided (if any)** which would be located in `agent-os/specs/[this-spec]/planning/visuals/`
- **User Standards & Preferences** which are defined below.

## Self-verify and test your work by:
- Running the relevant checks for your scope:
  - `yarn lint`, `yarn typecheck`, and focused Jest suites for components/hooks or Cloud Functions.
  - Firebase Emulator tests for any Firestore/Auth/Storage/Functions logic (`firebase emulators:exec` or targeted scripts).
  - Detox or manual device testing for user-facing flows.
- Capturing screenshots or recordings from iOS Simulator and Android Emulator for UI work. Store them in `agent-os/specs/[this-spec]/verification/screenshots/` with descriptive filenames.
- Verifying analytics events, Remote Config flags, and security rules behavior if your change touches them.
- Reviewing screenshots/logs against requirements before handoff.


## Display confirmation and next step

Display a summary of what was implemented.

IF all tasks are now marked as done (with `- [x]`) in tasks.md, display this message to user:

```
All tasks have been implemented: `agent-os/specs/[this-spec]/tasks.md`.

NEXT STEP 👉 Run `3-verify-implementation.md` to verify the implementation.
```

IF there are still tasks in tasks.md that have yet to be implemented (marked unfinished with `- [ ]`) then display this message to user:

```
Would you like to proceed with implementation of the remaining tasks in tasks.md?

If not, please specify which task group(s) to implement next.
```

## User Standards & Preferences Compliance

IMPORTANT: Ensure that the tasks list is ALIGNED and DOES NOT CONFLICT with the user's preferences and standards as detailed in the following files:

@agent-os/standards/backend/api.md
@agent-os/standards/backend/migrations.md
@agent-os/standards/backend/models.md
@agent-os/standards/backend/queries.md
@agent-os/standards/frontend/accessibility.md
@agent-os/standards/frontend/components.md
@agent-os/standards/frontend/css.md
@agent-os/standards/frontend/responsive.md
@agent-os/standards/global/coding-style.md
@agent-os/standards/global/commenting.md
@agent-os/standards/global/conventions.md
@agent-os/standards/global/error-handling.md
@agent-os/standards/global/tech-stack.md
@agent-os/standards/global/validation.md
@agent-os/standards/testing/test-writing.md
