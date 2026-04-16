# Tetris Game Project

## Project Overview
A browser-based Tetris clone built as a learning project. The goal is to learn Claude AI and Claude Code best practices by building a real, playable game incrementally.

## Tech Stack
- **Vanilla HTML + CSS + JavaScript** with **HTML5 Canvas** for game rendering
- No frameworks, no build tools — open `index.html` in browser to run
- Canvas for game grid/pieces, DOM for UI (menus, score display)
- Designed for future mobile (Capacitor) and backend (Node.js/Express + PostgreSQL) — see `docs/decisions.md`

## Folder Structure
```
/                       # Project root
├── CLAUDE.md           # Project instructions for Claude
├── docs/               # Design notes, decisions log, research
│   └── decisions.md    # Tech stack & architecture decisions
├── src/                # Game source code
│   ├── index.html      # Entry point
│   ├── css/            # Stylesheets
│   └── js/             # Game logic
├── assets/             # Images, sounds, fonts
└── tests/              # Test files (mirrors src/ structure)
```

## Coding Conventions
- Clear, descriptive variable and function names (no abbreviations)
- Comments explain *why*, not *what*
- One responsibility per function — keep functions short
- Constants for magic numbers (board width, speeds, scores, colors)
- No premature optimization — clarity over cleverness

## Commands
- **Run game:** Open `src/index.html` in browser (no build step)
- **Run tests:** TBD — lightweight test runner to be selected

## Key References
- Requirements & game rules: `docs/requirements.md`
- Architecture & design approach: `docs/design-notes.md`
- Tech stack & architecture decisions: `docs/decisions.md`

## Working Rules for Claude
- Before implementing any feature: search the web for best practices
- Propose approach before writing code — get approval first
- Break work into small, testable increments
- When uncertain about game mechanics, ask — don't assume
- Always explain *what* you're doing and *why* (this is a learning project)
- Save all deliverables to the project folder
