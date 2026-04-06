SHELL := bash

BUN ?= bun
NODE_VERSION := 24.13.1
BUN_VERSION := 1.3.11

.PHONY: help bootstrap doctor sync-agent-skills sync-agent-skills-check install-tools check-tools print-toolchain install-dev-tools precommit-install precommit-run lint test format format-check repo-lint repo-test repo-format repo-format-check

help:
	@echo "Targets:"
	@echo "  bootstrap         Install toolchain when possible and run baseline setup"
	@echo "  sync-agent-skills Refresh managed common skills from sibling platform-blueprint-specs"
	@echo "  sync-agent-skills-check Fail if managed common skills drift from sibling platform-blueprint-specs"
	@echo "  doctor            Run shared workstation checks from sibling platform-blueprint-specs"
	@echo "  install-tools     Install pinned tools with mise/asdf if available"
	@echo "  check-tools       Validate pinned tool versions"
	@echo "  print-toolchain   Print pinned tool versions"
	@echo "  install-dev-tools Install Python and Bun development tooling"
	@echo "  precommit-install Install git pre-commit hooks"
	@echo "  precommit-run     Run the configured pre-commit checks on all files"
	@echo "  lint              Run repo lint checks"
	@echo "  test              Run repo tests"
	@echo "  format            Apply repo formatting"
	@echo "  format-check      Check repo formatting without writing changes"

bootstrap: install-tools check-tools install-dev-tools
	$(BUN) install --frozen-lockfile

sync-agent-skills:
	@if [[ -f ../platform-blueprint-specs/scripts/sync-common-skills.sh ]]; then \
		bash ../platform-blueprint-specs/scripts/sync-common-skills.sh --repo-root "$$(pwd)"; \
	else \
		echo "Shared skill sync script not found at ../platform-blueprint-specs/scripts/sync-common-skills.sh" >&2; \
		echo "Keep platform-blueprint-specs as a sibling checkout to use make sync-agent-skills in this workspace." >&2; \
		exit 1; \
	fi

sync-agent-skills-check:
	@if [[ -f ../platform-blueprint-specs/scripts/sync-common-skills.sh ]]; then \
		bash ../platform-blueprint-specs/scripts/sync-common-skills.sh --check --repo-root "$$(pwd)"; \
	else \
		echo "Shared skill sync script not found at ../platform-blueprint-specs/scripts/sync-common-skills.sh" >&2; \
		echo "Keep platform-blueprint-specs as a sibling checkout to use make sync-agent-skills-check in this workspace." >&2; \
		exit 1; \
	fi

doctor: sync-agent-skills
	@if [[ -f ../platform-blueprint-specs/scripts/windows-tooling-doctor.ps1 ]]; then \
		powershell -ExecutionPolicy Bypass -File ../platform-blueprint-specs/scripts/windows-tooling-doctor.ps1; \
	else \
		echo "Shared doctor script not found at ../platform-blueprint-specs/scripts/windows-tooling-doctor.ps1" >&2; \
		echo "Keep platform-blueprint-specs as a sibling checkout to use make doctor in this workspace." >&2; \
		exit 1; \
	fi

install-tools:
	@if command -v mise >/dev/null 2>&1; then \
		echo "Installing pinned tools with mise..."; \
		mise install; \
	elif command -v asdf >/dev/null 2>&1; then \
		echo "Installing pinned tools with asdf..."; \
		asdf install; \
	else \
		echo "No supported version manager detected. Validating local tools only."; \
	fi

check-tools:
	@actual_node="$$(node --version 2>/dev/null || true)"; \
	if [[ -z "$$actual_node" ]]; then \
		echo "Node.js is required but not installed. Expected $(NODE_VERSION)." >&2; \
		exit 1; \
	fi; \
	if [[ "$$actual_node" != *"$(NODE_VERSION)"* ]]; then \
		echo "Node.js version mismatch. Expected $(NODE_VERSION), got: $$actual_node" >&2; \
		exit 1; \
	fi
	@actual_bun="$$( $(BUN) --version 2>/dev/null || true)"; \
	if [[ -z "$$actual_bun" ]]; then \
		echo "Bun is required but not installed. Expected $(BUN_VERSION)." >&2; \
		exit 1; \
	fi; \
	if [[ "$$actual_bun" != *"$(BUN_VERSION)"* ]]; then \
		echo "Bun version mismatch. Expected $(BUN_VERSION), got: $$actual_bun" >&2; \
		exit 1; \
	fi

print-toolchain:
	@echo "Node.js $(NODE_VERSION)"
	@echo "Bun $(BUN_VERSION)"

install-dev-tools:
	python -m pip install --user -r requirements-dev.txt
	$(BUN) install

precommit-install: install-dev-tools
	python -m pre_commit install --hook-type pre-commit --hook-type pre-push

precommit-run:
	python -m pre_commit run --all-files --show-diff-on-failure

lint: repo-lint

test: repo-test

format: repo-format

format-check: repo-format-check

repo-lint:
	$(BUN) run lint

repo-test:
	$(BUN) run test

repo-format:
	$(BUN) run format

repo-format-check:
	$(BUN) run format:check
