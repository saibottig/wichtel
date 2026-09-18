# Make master the default branch

Type: task
Status: open

## Question

The repository still defaults to `claude/matpockock-skills-usage-1qhg5f`, the scratch branch created at the start of this work.
It carries none of the current setup.

Switch the default to `master` in the repository settings, under Branches.

This is human work, because no tool available in an agent session can change a repository setting.

Done when a fresh clone with no branch argument lands on `master`.
Consider deleting the scratch branch at the same time, since everything on it is superseded.
