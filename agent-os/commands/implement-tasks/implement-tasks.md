Now that we have a spec and tasks list ready for implementation, we will proceed with implementation of this spec by following this multi-phase process:

PHASE 1: Determine which task group(s) from tasks.md should be implemented
PHASE 2: Implement the given task(s)
PHASE 3: After ALL task groups have been implemented, produce the final verification report.

Carefully read and execute the instructions in the following files IN SEQUENCE, following their numbered file names.  Only proceed to the next numbered instruction file once the previous numbered instruction has been executed.

Instructions to follow in sequence:

# PHASE 1: Determine Tasks

First, check if the user has already provided instructions about which task group(s) to implement.

**If the user HAS provided instructions:** Proceed to PHASE 2 to delegate implementation of those specified task group(s) to the **implementer** subagent.

**If the user has NOT provided instructions:**

Read `agent-os/specs/[this-spec]/tasks.md` to review the available task groups, then output the following message to the user and WAIT for their response:

```
Should we proceed with implementation of all task groups in tasks.md?

If not, then please specify which task(s) to implement.
```

# PHASE 2: Implement Tasks

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

# PHASE 3: Verify Implementation

Now that we've implemented all tasks in tasks.md, we must run final verifications and produce a verification report using the following MULTI-PHASE workflow:

## Workflow

### Step 1: Ensure tasks.md has been updated

Check `agent-os/specs/[this-spec]/tasks.md` and ensure that all tasks and their sub-tasks are marked as completed with `- [x]`.

> Device + tooling expectations should match `profiles/react-firebase/standards/global/tech-stack.md`. Update that file first if simulator/device targets or Firebase services change.

If a task is still marked incomplete, then verify that it has in fact been completed by checking the following:
- Run a brief spot check in the code to find evidence that this task's details have been implemented (screens, hooks, Cloud Functions, Firestore rules).
- Check for existence of an implementation report titled using this task's title in `agent-os/spec/[this-spec]/implementation/` folder.
- For UI tasks, open the iOS Simulator and Android Emulator (or attached devices) and confirm the described flow behaves as expected. Compare against screenshots attached in `verification/screenshots`.
- For backend tasks, inspect Firebase Emulator logs and ensure associated tests passed or were updated.

IF you have concluded that this task has been completed, then mark it's checkbox and its' sub-tasks checkboxes as completed with `- [x]`.

IF you have concluded that this task has NOT been completed, then mark this checkbox with ⚠️ and note it's incompleteness in your verification report.


### Step 2: Update roadmap (if applicable)

Open `agent-os/product/roadmap.md` and check to see whether any item(s) match the description of the current spec that has just been implemented.  If so, then ensure that these item(s) are marked as completed by updating their checkbox(s) to `- [x]`.


### Step 3: Run entire tests suite

Run the full stack of automated checks (see `profiles/react-firebase/standards/global/tech-stack.md` for canonical commands/tools):

1. `yarn lint` and `yarn typecheck`
2. `yarn test` (Jest) for React Native components, hooks, and shared packages
3. Cloud Functions unit/integration tests via `yarn test:functions` (or equivalent) targeting the Firebase Emulator
4. Detox smoke suite (`yarn detox test --configuration ios.sim.debug` and Android equivalent) for release candidates

Capture pass/fail counts for each command plus any failing test names and include them in the verification report. Do NOT attempt to fix failing tests during verification—record the failures and notify the team.


### Step 4: Create final verification report

Create your final verification report in `agent-os/specs/[this-spec]/verifications/final-verification.html`.

The content of this report should follow this structure:

```markdown
# Tech stack reference
- Follow `profiles/react-firebase/standards/global/tech-stack.md` for the authoritative list of tools (tests, emulators, devices). Update that document first if the stack changes.

# Verification Report: [Spec Title]

**Spec:** `[spec-name]`
**Date:** [Current Date]
**Verifier:** implementation-verifier
**Status:** ✅ Passed | ⚠️ Passed with Issues | ❌ Failed

---

## Executive Summary

[Brief 2-3 sentence overview of the verification results and overall implementation quality]

---

## 1. Tasks Verification

**Status:** ✅ All Complete | ⚠️ Issues Found

### Completed Tasks
- [x] Task Group 1: [Title]
  - [x] Subtask 1.1
  - [x] Subtask 1.2
- [x] Task Group 2: [Title]
  - [x] Subtask 2.1

### Incomplete or Issues
[List any tasks that were found incomplete or have issues, or note "None" if all complete]

---

## 2. Documentation Verification

**Status:** ✅ Complete | ⚠️ Issues Found

### Implementation Documentation
- [x] Task Group 1 Implementation: `implementations/1-[task-name]-implementation.md`
- [x] Task Group 2 Implementation: `implementations/2-[task-name]-implementation.md`

### Verification Documentation
[List verification documents from area verifiers if applicable]

### Missing Documentation
[List any missing documentation, or note "None"]

---

## 3. Roadmap Updates

**Status:** ✅ Updated | ⚠️ No Updates Needed | ❌ Issues Found

### Updated Roadmap Items
- [x] [Roadmap item that was marked complete]

### Notes
[Any relevant notes about roadmap updates, or note if no updates were needed]

---

## 4. Test Suite Results

**Status:** ✅ All Passing | ⚠️ Some Failures | ❌ Critical Failures

### Test Summary
- **Lint:** [pass/fail, command]
- **Typecheck:** [pass/fail, command]
- **Jest (app):** [total/pass/fail]
- **Jest (functions):** [total/pass/fail]
- **Detox / Device Tests:** [config + pass/fail]

### Failed Tests
[List any failing tests with their descriptions, or note "None - all tests passing"]

### Notes
[Mention Firebase Emulator coverage, device types tested (iOS/Android), and any Crashlytics/Sentry alerts observed during verification.]
```
