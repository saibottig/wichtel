# Agent Instructions

These are common instructions for agents across all scenarios.

## General Guidelines

- Never use the em dash "—". Use plain dash "-" instead.

- When writing commit messages, NEVER auto-add your agent name as co-author or add the Claude Session Link.

- Never manually modify CHANGELOG.md files or any files that are marked as auto-generated.

- When writing or substantially editing long Markdown files, put each full sentence on its own line.
Preserve normal Markdown structure, but avoid wrapping multiple sentences onto one physical line.

- When making technical decisions, do not give much weight to development cost.
Instead, prefer quality, simplicity, robustness, scalability, and long term maintainability.

- When doing bug fixes, always start with reproducing the bug in an E2E setting as closely aligned with how an end user would encounter it.
This makes sure you find the real problem so your fix will actually solve it.

- When end-to-end testing a product, be picky about the UI you see and be obsessed with pixel perfection.
If something clearly looks off, even if it is not directly related to what you are doing, try to get it fixed along the way.

- Apply that same high standard to engineering excellence: lint, test failures, and test flakiness.
If you see one, even if it is not caused by what you are working on right now, still get it fixed.

## Opinions & Principles

When you are working on something that would benefit from being informed by the maintainer's viewpoints, read ~/OPINIONS.md to understand them.

## Voice Profile

When you are talking/posting on behalf of the maintainer using their identity, read ~/VOICE.md to match the intended voice and communication style.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/`, one file per ticket.
Commit them.
Web sessions run in throwaway containers, so an uncommitted ticket is lost when the container is reclaimed.
See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles are used as-is, with no renaming.
Because tickets are files rather than tracker objects, a label is a `Status:` line near the top of the file.
See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` and `docs/adr/` at the repo root.
Neither exists yet, and neither should be created upfront.
See `docs/agents/domain.md`.
