# Bug Report Guidelines

Before filing a bug report, please make sure that:
- The bug you've encountered is reproducible.
- The bug has not already been reported.

Once you've concluded that the bug is reproducible and unreported, please write a concise bug report following the template below:

**Issue:**
Removed states still appear in the transition origin/destination select field.

**Severity:**
Minor

**Summary:**
When removing states from an automaton, they are removed from the rendered diagram and list of states; however, a removed state is still listed as an option in the transition origin-destination field.

**Description:**
Take the automaton with three states: Q0, Q1, Q2. If the state Q1 is removed, the diagram will be updated to omit Q1. However, under the transition dropdown menu, the state Q1 is still listed as an origin/destination. If a user attempts to use this state, they will receive an error stating that they automaton could not be rendered.

**Feature:**
State Removal, Transition Creation

**Browser:**
Google Chrome 49

**Operating System:**
Manjaro Linux
