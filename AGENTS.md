# Agent Context

## Local Entry Point

This file is the repo-local entry point for agent context.

## Always Load

Before making changes:

1. Read `README.md`.
2. Read `Makefile` if present.
3. Run `make sync-agent-skills` before starting major changes or when shared skill guidance may have changed.
4. Read the shared planning docs referenced below.
5. Check for repo-specific docs under `docs/` that affect the task.

## Shared Planning Docs

- `../platform-blueprint-specs/common/AGENTS.md`
- Add repo-specific planning or sibling-repo docs here when needed.

## Priority of Instructions

Repo-local instructions override shared planning docs.

If repo-specific instructions in `README.md`, `docs/`, or task materials conflict with a shared planning file, the more specific repo/task instruction wins.
