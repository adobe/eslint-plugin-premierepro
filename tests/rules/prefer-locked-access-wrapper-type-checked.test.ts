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

import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/prefer-locked-access-wrapper-type-checked";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
});

ruleTester.run("prefer-locked-access-wrapper-type-checked", rule, {
  valid: [
    // executeTransaction inside lockedAccess
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.lockedAccess(() => {
          project.executeTransaction((compoundAction) => {
            // Action creation and transaction handling together
          }, "Move clip");
        });
      `,
    },
    // lockedAccess without executeTransaction
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.lockedAccess(() => {
          // Some locked operation
        });
      `,
    },
  ],

  invalid: [
    // Bare executeTransaction at top level
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          // This is bare executeTransaction, not wrapped in lockedAccess
        }, "My Undo String");
      `,
      errors: [{ messageId: "preferNested" }],
    },
    // Multiple bare executeTransaction calls
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((ca) => {
          // First transaction
        }, "First");
        project.executeTransaction((ca) => {
          // Second transaction
        }, "Second");
      `,
      errors: [{ messageId: "preferNested" }, { messageId: "preferNested" }],
    },
  ],
});
