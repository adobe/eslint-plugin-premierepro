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
 * Verifies that the version about to be published is greater than whatever is
 * currently published at the target dist-tag on npm. Fails if publishing would
 * move a dist-tag backwards (e.g. releasing 26.3.0-beta.15 when @beta already
 * points to 26.3.0-beta.19).
 *
 * Exits cleanly (0) if the dist-tag has never been published before.
 *
 * Environment variables:
 *   VERSION      - the version about to be published (e.g. '26.3.0-beta.20')
 *   DIST_TAG     - the npm dist-tag being updated (e.g. 'beta', 'latest')
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { DIST_TAG, VERSION } = process.env;

if (!DIST_TAG) {
  console.error("::error::DIST_TAG is required");
  process.exit(1);
}
if (!VERSION) {
  console.error("::error::VERSION is required");
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { name: string };
const packageName = packageJson.name;

/**
 * Parses a version string into a comparable tuple.
 * Stable versions sort above their beta counterparts:
 *   26.3.0-beta.19  →  [26, 3, 0, 19]
 *   26.3.0          →  [26, 3, 0, Infinity]
 */
function parseVersion(v: string): number[] {
  const beta = v.match(/^(\d+)\.(\d+)\.(\d+)-beta\.(\d+)$/);
  if (beta) {
    return beta.slice(1).map(Number);
  }
  const stable = v.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (stable) {
    return [...stable.slice(1).map(Number), Infinity];
  }
  throw new Error(`Unrecognized version format: "${v}"`);
}

function isGreater(a: string, b: string): boolean {
  const pa = parseVersion(a);
  const pb = parseVersion(b);

  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av > bv) {
      return true;
    }
    if (av < bv) {
      return false;
    }
  }
  return false; // equal
}

// Query npm for the current version at this dist-tag.
let currentPublished: string | null = null;
try {
  const raw = execSync(`npm view ${packageName} dist-tags.${DIST_TAG} 2>/dev/null`, {
    encoding: "utf8",
  }).trim();
  currentPublished = raw || null;
} catch {
  currentPublished = null;
}

if (!currentPublished) {
  console.log(`Dist-tag @${DIST_TAG} has not been published yet — no ordering check needed.`);
  process.exit(0);
}

console.log(`Current @${DIST_TAG}: ${currentPublished}`);
console.log(`Publishing:          ${VERSION}`);

if (!isGreater(VERSION, currentPublished)) {
  console.error(
    `::error::${VERSION} is not greater than the currently published ` +
      `@${DIST_TAG} version (${currentPublished}). Publishing would move the ` +
      `dist-tag backwards. If this beta number is intentional, the current ` +
      `published version must be retracted first.`
  );
  process.exit(1);
}

console.log(`Version order check passed.`);
