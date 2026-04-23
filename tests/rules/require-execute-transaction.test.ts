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
import rule from "../../src/rules/require-execute-transaction";

const ruleTester = new RuleTester();

ruleTester.run("require-execute-transaction", rule, {
  valid: [
    {
      code: `
        project.executeTransaction((compoundAction) => {
          compoundAction.addAction(action);
        }, "Edit");
      `,
    },
    {
      code: `
        project.executeTransaction(function (compoundAction) {
          compoundAction.addAction(action);
        }, "Edit");
      `,
    },
    // Nested helper inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          const addAll = () => {
            compoundAction.addAction(action1);
            compoundAction.addAction(action2);
          };
          addAll();
        }, "Edit");
      `,
    },
    // Unrelated method call
    {
      code: `
        someObject.doSomething();
      `,
    },
  ],

  invalid: [
    // Top-level addAction
    {
      code: `
        compoundAction.addAction(action);
      `,
      errors: [{ messageId: "missingExecuteTransaction" }],
    },
    // addAction inside lockedAccess but not executeTransaction
    {
      code: `
        project.lockedAccess(() => {
          compoundAction.addAction(action);
        });
      `,
      errors: [{ messageId: "missingExecuteTransaction" }],
    },
    // addAction in a regular function
    {
      code: `
        function apply(compoundAction, action) {
          compoundAction.addAction(action);
        }
      `,
      errors: [{ messageId: "missingExecuteTransaction" }],
    },
    // addAction inside an unrelated callback
    {
      code: `
        items.forEach((item) => {
          compoundAction.addAction(item.action);
        });
      `,
      errors: [{ messageId: "missingExecuteTransaction" }],
    },
  ],
});
