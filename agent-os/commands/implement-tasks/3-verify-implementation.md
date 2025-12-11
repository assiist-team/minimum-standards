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
