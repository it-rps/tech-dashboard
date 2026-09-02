# Where these files go — Hermes Agent

This package has two parts, and Hermes has specific rules for where
each one belongs and how it gets loaded.

```
your-project/                          ← git root
├── AGENTS.md                          ← put this here
└── skills/
    └── project/                       ← category folder — pick any name
        └── irepair-stock-service/     ← put this whole folder here
            ├── SKILL.md
            └── references/
                ├── decision-rules.md
                ├── business-context.md
                ├── tech-stack.md
                ├── file-structure.md
                ├── database-schema.md
                ├── costing-logic.md
                ├── business-flows.md
                ├── code-patterns.md
                ├── responsive-spec.md
                └── i18n-dashboard-reports.md
```

## 1. `AGENTS.md` — project root, not `CLAUDE.md`

Hermes loads **only one** project context file per session, first match
wins, in this order: `.hermes.md` → `AGENTS.md` → `CLAUDE.md` →
`.cursorrules`. Since `AGENTS.md` sits above `CLAUDE.md` in that list,
this package uses `AGENTS.md` — don't keep a `CLAUDE.md` alongside it,
Hermes would never read it.

Hermes also discovers `AGENTS.md` **progressively as it walks into
subdirectories** during a session — so if this project later grows
`frontend/` or `backend/` subfolders with their own `AGENTS.md`, Hermes
will pick those up automatically when it reads files there. You don't
need to do anything for that to work; it's mentioned here so you know
the behavior if you split the project later.

## 2. The Skill — `skills/<category>/irepair-stock-service/`

Hermes expects in-repo skills at
`skills/<category>/<name>/SKILL.md` (or `optional-skills/...` for
skills you don't want active by default). `<category>` is just a
folder you choose for organization — `project/`, `dev/`, anything
reasonable works. Put the whole `irepair-stock-service/` folder inside
it, unchanged.

Hermes loads skills the same progressive way described earlier in this
chat: a compact list of all skills loads at session start (~3k tokens
total across all skills), then the full `SKILL.md` for this one loads
only when Hermes decides a task matches its `description`, and each
`references/*.md` file loads only when that specific file is needed.
This is exactly the behavior the Step Router in `SKILL.md` was written
for — no changes needed there.

## 3. Alternative: install to `~/.hermes/skills/` instead

If you want this Skill available across every project rather than just
this one repo, copy `irepair-stock-service/` into
`~/.hermes/skills/<category>/` instead of committing it inside the
project repo. Functionally identical — just changes whether it's
project-scoped (in-repo) or available everywhere (global).

## 4. One thing to double-check yourself

Hermes runs a description-length check when reviewing skills (some
guidance suggests keeping the trigger/summary tight, ideally noticeable
within roughly the first 60 characters). This Skill's `description` in
`SKILL.md`'s frontmatter is intentionally detailed so Claude and other
agentskills.io-compatible tools trigger on it reliably — if Hermes's
skill review flags it as too long, you can trim it to a shorter
sentence without losing function; the Step Router table inside
`SKILL.md` is what actually does the routing work, not the frontmatter
description's length.
