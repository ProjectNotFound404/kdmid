# Repository Guidelines

## Project Structure & Module Organization

This repository directory is currently empty apart from this guide. No source code, tests, assets, or dependency manifests exist yet. When introducing the initial implementation, group related modules by responsibility and document their locations in this file. Keep generated output and local environment files separate from tracked source files.

## Build, Test, and Development Commands

No build system, application entry point, or development commands are configured. Once the technology stack is selected, provide reproducible setup, run, test, and lint commands in the project README. Use the project's declared package manager and committed dependency lockfile. Update this guide with commands that have actually been verified; do not assume `npm test`, `make build`, or similar scripts exist.

## Coding Style & Naming Conventions

No language-specific style or formatting tools are established. For the initial implementation, choose consistent indentation and idiomatic naming for the selected language. Add formatter and linter configuration alongside the first source files. For subsequent changes, follow those configurations and surrounding code rather than introducing competing conventions. Prefer descriptive names and small, focused modules.

## Testing Guidelines

No testing framework or coverage threshold is configured. Introduce tests with the first executable behavior and document how to run them. Use the selected framework's standard file naming and discovery rules. Cover expected behavior, boundary conditions, and failure paths; keep tests deterministic and independent of live services where practical.

## Commit & Pull Request Guidelines

This directory is not currently a Git repository, so no commit conventions can be inferred. After Git initialization, use concise, imperative commit subjects such as `Add application configuration`. Keep commits focused. Pull requests should explain the change, list verification performed, and link relevant issues. Include screenshots when changes affect a user interface.

## Security & Configuration

Never commit credentials, tokens, or private keys. Use environment variables for secrets, document required settings with placeholder values, and ignore local configuration and generated artifacts before committing them.
