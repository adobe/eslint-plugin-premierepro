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

import { syntacticRules, typeCheckedRules } from "./rules";

// Keep this to avoid TSC copying the package.json file to the dist directory
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { name, version } = require("../package.json") as { name: string; version: string };

const plugin = {
  configs: {
    // partial configs for eslint/config to merge
    recommended: {},
    recommendedTypeChecked: {},
  },
  meta: {
    name,
    namespace: "@adobe",
    version,
  },
  rules: {
    ...syntacticRules,
    ...typeCheckedRules,
  },
};

const recommendedConfig = {
  plugins: {
    "@adobe/premierepro": plugin,
  },
  rules: {
    "@adobe/premierepro/no-action-scope-escape": "error",
    "@adobe/premierepro/no-async-in-locked-access": "error",
    "@adobe/premierepro/no-async-in-execute-transaction": "error",
    "@adobe/premierepro/prefer-locked-access-wrapper": "warn",
    "@adobe/premierepro/prefer-undo-string": "warn",
    "@adobe/premierepro/require-execute-transaction": "error",
    "@adobe/premierepro/require-action-lock-scope": "error",
  },
};

const recommendedTypeCheckedConfig = {
  plugins: {
    "@adobe/premierepro": plugin,
  },
  rules: {
    "@adobe/premierepro/no-action-scope-escape-type-checked": "error",
    "@adobe/premierepro/no-async-in-locked-access-type-checked": "error",
    "@adobe/premierepro/no-async-in-execute-transaction-type-checked": "error",
    "@adobe/premierepro/prefer-locked-access-wrapper-type-checked": "warn",
    "@adobe/premierepro/prefer-undo-string-type-checked": "warn",
    "@adobe/premierepro/require-execute-transaction-type-checked": "error",
    "@adobe/premierepro/require-action-lock-scope-type-checked": "error",
  },
};

Object.assign(plugin.configs, {
  recommended: recommendedConfig,
  recommendedTypeChecked: recommendedTypeCheckedConfig,
});

export = plugin;
