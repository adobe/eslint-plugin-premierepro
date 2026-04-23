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
import rule from "../../src/rules/prefer-undo-string";

const ruleTester = new RuleTester();

ruleTester.run("prefer-undo-string", rule, {
  valid: [
    // With undo string
    {
      code: `
        project.executeTransaction((compoundAction) => {
          compoundAction.addAction(action);
        }, "Move clip");
      `,
    },
    // With variable as undo string
    {
      code: `
        project.executeTransaction((compoundAction) => {
          compoundAction.addAction(action);
        }, undoLabel);
      `,
    },
    // Unrelated method call with one argument
    {
      code: `
        someObject.executeQuery(callback);
      `,
    },
    // Unrelated method with same name but not a member expression
    {
      code: `
        executeTransaction(callback);
      `,
    },
  ],

  invalid: [
    // Missing undo string
    {
      code: `
        project.executeTransaction((compoundAction) => {
          compoundAction.addAction(action);
        });
      `,
      errors: [{ messageId: "missingUndoString" }],
    },
    // Missing undo string with function expression
    {
      code: `
        project.executeTransaction(function (compoundAction) {
          compoundAction.addAction(action);
        });
      `,
      errors: [{ messageId: "missingUndoString" }],
    },
  ],
});
