# Versioning

This document describes how versions are managed and released for `@adobe/eslint-plugin-premierepro`.

## Table of Contents

- [Relationship to @adobe/premierepro](#relationship-to-adobepremierepro)
- [Quick Reference: What Release Should I Cut?](#quick-reference-what-release-should-i-cut)
- [Version scheme](#version-scheme)
- [npm distribution tags](#npm-distribution-tags)
- [Branch structure](#branch-structure)
- [Workflows](#workflows)
  - [`prepare-release` — creates the release PR](#prepare-release--creates-the-release-pr)
  - [`publish` — publishes to npm after PR merge](#publish--publishes-to-npm-after-pr-merge)
- [When to Release](#when-to-release)
- [Scenarios](#scenarios)
  - [Publishing a beta release](#scenario-publishing-a-beta-release)
  - [Cutting a stable release](#scenario-cutting-a-stable-release)
  - [Backport patch release](#scenario-backport-patch-release)
- [Major version bumps](#major-version-bumps)
- [CHANGELOG policy](#changelog-policy)

## Relationship to @adobe/premierepro

The ESLint rules in this plugin are tightly coupled to the API surface defined in `@adobe/premierepro` (the type definitions package). Every release of this plugin pins a specific version of `@adobe/premierepro` in both its `devDependencies` (exact version, for reproducible builds) and `peerDependencies` (a range, to communicate compatibility to users).

**Version alignment convention:**

| Plugin release | `@adobe/premierepro` pinned to | peerDependency range |
|---|---|---|
| `26.3.0-beta.29` | `26.3.0-beta.29` | `26.3.0-beta.29` (exact) |
| `26.3.0` (stable) | `26.3.0` | `~26.3.0` (patches allowed) |
| `26.3.1` (backport) | `26.3.0` | `~26.3.0` (patches allowed) |

The beta numbers are kept in sync: if a new API is available in `@adobe/premierepro@26.3.0-beta.29`, the corresponding rule support ships in `eslint-plugin-premierepro@26.3.0-beta.29`. If no new rules are needed for a given types beta, the plugin skips that beta number.

The `types_version` workflow input lets you override the automatic computation if the versions need to diverge for any reason.

---

## Quick Reference: What Release Should I Cut?

```
Have you merged a new rule or fix to main?
├─ YES: Is Premiere shipping a new stable version soon?
│   ├─ YES: Cut a STABLE release
│   └─ NO: Cut a BETA release
└─ NO: Is there a critical bug in an already-released stable version?
    ├─ YES: Cut a BACKPORT patch
    └─ NO: No release needed
```

**Troubleshooting:**
- Cut a beta before stable if APIs have changed in the premierepro-types beta you're targeting.
- Accidentally started the wrong release? Close the PR and start over — no harm done until you merge.

## Version scheme

Package versions mirror `@adobe/premierepro` (and Premiere Pro's release schedule) where possible:

| Version format | Example | Meaning |
|---|---|---|
| `X.Y.0-beta.N` | `26.3.0-beta.15` | Beta release, rules targeting Premiere 26.3.0 Beta build 15 |
| `X.Y.0` | `26.3.0` | Stable release aligned with Premiere 26.3.0 |
| `X.Y.Z` (Z > 0) | `26.3.1` | Backport patch to the 26.3 stable line |

## npm distribution tags

| Tag | Points to | Use Case |
|---|---|---|
| `@latest` | Most recent stable release | Production use. Most users should install this. |
| `@beta` | Most recent beta release | Early testing of upcoming rules before stable. |
| `@release-X.Y` | Most recent patch on the `X.Y` stable line | Staying on a specific minor version. |

## Branch structure

| Branch | Purpose |
|---|---|
| `main` | Active development. Always tracks the current beta version (e.g. `26.3.0-beta.N`). |
| `release/X.Y` | Stable line for `X.Y`. Created automatically when `X.Y.0` is released. Backport patches only. |
| `release-prep/*` | **Temporary branches created automatically by the prepare-release workflow.** Deleted after the PR is merged. |

## Workflows

All releases go through a two-step process: **prepare** (creates a PR) then **publish** (runs automatically when the PR is merged). No workflow ever pushes directly to `main` or `release/*`.

> **Repository requirement:** `main` and `release/**` must be configured to use **"Pull request title and description"** as the squash commit message (Settings → General → Pull Requests → "Allow squash merging" → Default commit message). This ensures the squash commit includes the PR body, which carries the `Next-Cycle:` trailer and the full list of changes.

### `prepare-release` — creates the release PR

Triggered manually via **Actions → Prepare Release → Run workflow**.

| Input | Required | Description |
|---|---|---|
| `type` | Yes | `beta`, `stable`, or `backport` |
| `build_number` | No (beta only) | Explicit prerelease number. If not provided, increments `N` by 1 from the current version. |
| `next_cycle` | No (stable only) | Base version for the next beta cycle (e.g. `26.4.0` or `27.0.0` for a major bump). Auto-increments minor if not provided. **Must be set explicitly for major version bumps.** |
| `types_version` | No | Override the `@adobe/premierepro` version to pin. Defaults to: same version as the release for beta/stable; `X.Y.0` for backports. Set this if the plugin and types beta numbers need to diverge. |

The workflow:
1. Computes the next version
2. Pins `@adobe/premierepro` in `devDependencies` (exact) and `peerDependencies` (range)
3. Updates `package.json`, `package-lock.json`, and `CHANGELOG.md`
4. Opens a PR whose body includes the full CHANGELOG entry for this release. When squash-merged, this body becomes the commit message body on `main`.

> **For backport releases**, run this workflow from the appropriate `release/X.Y` branch using the branch dropdown in the Actions UI.

### `publish` — publishes to npm after PR merge

Triggered automatically on every push to `main` or `release/**`. Only proceeds if the merged commit message starts with `chore: release `.

When a release commit is detected, the workflow:
1. Builds the package (`npm run build`)
2. Runs tests
3. Creates and pushes a git tag (`vX.Y.Z`)
4. Publishes to npm with the appropriate dist-tag
5. Creates a GitHub release

For **stable** releases it additionally:
- Creates the `release/X.Y` branch for future backports
- Opens a follow-up PR to bump `main` to the next beta cycle

---

## When to Release

**Beta releases:** Cut a beta release when you've merged new rules or rule fixes that target APIs available in a specific `@adobe/premierepro` beta.

**Stable releases:** Cut a stable release when:
- Premiere Pro ships a new stable version
- The corresponding `@adobe/premierepro` stable has been published
- All rules for the new API surface are merged to `main`

**Backport releases:** Cut a backport patch when a critical bug is discovered in an already-released stable version.

---

## Scenarios

### Scenario: publishing a beta release

**Starting state:** `main` is at `26.3.0-beta.5`. `@adobe/premierepro@26.3.0-beta.29` has been published with a new API, you've added a corresponding rule and merged it to `main`.

1. Go to **Actions → Prepare Release → Run workflow** (on `main`)
2. Set **type** = `beta`, **build_number** = `29` (to align with the types beta).
3. The workflow creates branch `release-prep/26.3.0-beta.29` and opens a PR:
   - `package.json` version: `26.3.0-beta.29`
   - `devDependencies["@adobe/premierepro"]`: `26.3.0-beta.29`
   - `peerDependencies["@adobe/premierepro"]`: `26.3.0-beta.29`
   - `CHANGELOG.md`: new `## 26.3.0-beta.29` section
4. Review the PR and merge.
5. The `publish` workflow publishes to npm as `@beta`.

---

### Scenario: cutting a stable release

**Starting state:** Premiere 26.3.0 has shipped. `@adobe/premierepro@26.3.0` has been published. `main` is at `26.3.0-beta.29`.

1. Go to **Actions → Prepare Release → Run workflow** (on `main`)
2. Set **type** = `stable`. Optionally set **next_cycle** = `26.4.0` (or leave blank to auto-increment the minor by 1).
3. The workflow creates branch `release-prep/26.3.0` and opens a PR:
   - `package.json` version: `26.3.0`
   - `devDependencies["@adobe/premierepro"]`: `26.3.0`
   - `peerDependencies["@adobe/premierepro"]`: `~26.3.0`
   - `CHANGELOG.md`: cumulative entry covering all `feat:` and `fix:` commits since `v26.2.0`
4. Review the PR and merge.
5. The `publish` workflow:
   - Publishes `26.3.0` to npm as `@latest`
   - Creates the `release/26.3` branch
   - Opens a follow-up PR to begin the `26.4.0-beta.0` cycle on `main`

---

### Scenario: backport patch release

**Starting state:** A bug is found in the stable `26.3.0` rules. The fix is on `release/26.3`.

1. Go to **Actions → Prepare Release → Run workflow**, select branch **`release/26.3`**
2. Set **type** = `backport`.
3. The workflow opens a PR:
   - `package.json` version: `26.3.1`
   - `devDependencies["@adobe/premierepro"]`: `26.3.0` (base stable, unchanged)
   - `peerDependencies["@adobe/premierepro"]`: `~26.3.0`
4. Review the PR and merge.
5. The `publish` workflow publishes `26.3.1` to npm as `@release-26.3`.

---

## Major version bumps

When Premiere transitions from `26.x` to `27.x`:

1. Cut the final `26.x` stable release normally.
2. For the next stable (or first beta), run `prepare-release` with **next_cycle** = `27.0.0`.
3. `main` will be bumped to `27.0.0-beta.0`, and subsequent betas will track `27.x`.

---

## CHANGELOG policy

| Release type | What's included |
|---|---|
| Beta | `feat:` and `fix:` commits since the previous tag (beta or stable) |
| Stable | Cumulative `feat:` and `fix:` commits since the last stable tag |
| Backport | All non-chore commits since the previous tag on the `release/X.Y` branch |

Breaking changes (`feat!:` / `fix!:`) are preserved verbatim in the entry so they're immediately visible without needing to look up the commit.
