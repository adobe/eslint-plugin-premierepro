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
import rule from "../../src/rules/prefer-undo-string-type-checked";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
});

ruleTester.run("prefer-undo-string-type-checked", rule, {
  valid: [
    // With undo string
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          compoundAction.addAction(action);
        }, "Move clip");
      `,
    },
    // With variable as undo string
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        const undoLabel = "Move clip";
        project.executeTransaction((compoundAction) => {
          compoundAction.addAction(action);
        }, undoLabel);
      `,
    },
    // executeTransaction on non-Project object -- NOT flagged
    {
      code: `
        const db = {
          executeTransaction(cb: () => void) { cb(); },
        };
        db.executeTransaction(() => {});
      `,
    },
    // Bare function call (not a member expression)
    {
      code: `
        declare function executeTransaction(cb: () => void): void;
        executeTransaction(() => {});
      `,
    },
  ],

  invalid: [
    // Missing undo string on premierepro Project
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          compoundAction.addAction(action);
        });
      `,
      errors: [{ messageId: "missingUndoString" }],
    },
    // Missing undo string with function expression
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction(function (compoundAction) {
          compoundAction.addAction(action);
        });
      `,
      errors: [{ messageId: "missingUndoString" }],
    },
  ],
});
