#!/usr/bin/env node

/*
 * Copyright 2026 Adobe. All rights reserved.
 *
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Opens a PR on main to begin the next beta cycle after a stable release.
 * Bumps package.json/package-lock.json to X.Y.0-beta.0 and opens a PR.
 *
 * The @adobe/premierepro devDependency and peerDependency are pinned to the
 * just-released stable version as a starting point. The first beta
 * prepare-release will update them to the correct beta version once it exists
 * on npm.
 *
 * The resulting commit message ('chore: begin X.Y.0-beta.0 cycle') does NOT
 * match the release commit pattern, so the publish workflow will ignore it.
 *
 * Environment variables:
 *   NEXT_CYCLE - base version for the next cycle (e.g. '26.4.0' or '27.0.0' for a major bump)
 *   GH_TOKEN   - GitHub token with repo + pull-requests write access
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { NEXT_CYCLE } = process.env;

if (!NEXT_CYCLE) {
  console.error("::error::NEXT_CYCLE is required.");
  process.exit(1);
}

// The current package.json is at the just-released stable version (e.g. 26.3.0).
const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
const currentStable = pkg.version;

const nextBeta = `${NEXT_CYCLE}-beta.0`;
const branch = `release-prep/${nextBeta}`;

// peerDependency range: allow patches on the current stable line (e.g. ~26.3.0).
// This will be tightened to the correct beta version by the first prepare-release.
const stableBase = currentStable.replace(/\.\d+$/, ".0");
const peerRange = `~${stableBase}`;

function run(cmd: string): string {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] });
}

run('git config user.name "github-actions[bot]"');
run('git config user.email "github-actions[bot]@users.noreply.github.com"');

// Bump plugin version.
run(`npm version ${nextBeta} --no-git-tag-version`);

// Pin @adobe/premierepro to the just-released stable. The new beta version
// doesn't exist on npm yet, so we use the stable as a placeholder. The first
// beta prepare-release will update this to the correct beta pin.
run(`npm install "@adobe/premierepro@${currentStable}" --save-dev --save-exact --package-lock-only`);
run(`npm pkg set "peerDependencies.@adobe/premierepro=${peerRange}"`);

run(`git checkout -b "${branch}"`);
run("git add package.json package-lock.json");
run(`git commit -m "chore: begin ${nextBeta} cycle"`);
run(`git push origin "${branch}"`);

run(
  `gh pr create ` +
    `--title "chore: begin ${nextBeta} cycle" ` +
    `--body "Opens the **${NEXT_CYCLE}** beta cycle on \`main\` following the stable release.\n\n` +
    `\`@adobe/premierepro\` is temporarily pinned to \`${currentStable}\` (the just-released stable). ` +
    `It will be updated to the correct beta version when the first beta \`prepare-release\` runs." ` +
    `--base main ` +
    `--head "${branch}"`
);

console.log(`\nOpened next-cycle PR for ${nextBeta}.`);
