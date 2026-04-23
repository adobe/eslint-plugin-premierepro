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
import rule from "../../src/rules/require-action-lock-scope";

const ruleTester = new RuleTester();

ruleTester.run("require-action-lock-scope", rule, {
  valid: [
    // Arrow function callback
    {
      code: `
        project.lockedAccess(() => {
          trackItem.createMoveAction(tickTime);
        });
      `,
    },
    // Regular function callback
    {
      code: `
        project.lockedAccess(function () {
          trackItem.createMoveAction(tickTime);
        });
      `,
    },
    // Nested inside executeTransaction within lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          project.executeTransaction((compoundAction) => {
            const action = trackItem.createMoveAction(tickTime);
            compoundAction.addAction(action);
          });
        });
      `,
    },
    // Multiple action calls inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          trackItem.createMoveAction(tickTime);
          trackItem.createSetInPointAction(tickTime);
          trackItem.createSetOutPointAction(tickTime);
        });
      `,
    },
    // Helper function defined and called inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          const createActions = () => {
            trackItem.createMoveAction(tickTime);
          };
          createActions();
        });
      `,
    },
    // Method name that doesn't match the pattern
    {
      code: `
        trackItem.createSomething(tickTime);
      `,
    },
    // Method name that doesn't match the pattern (no "Action" suffix)
    {
      code: `
        trackItem.createMove(tickTime);
      `,
    },
    // Bare executeTransaction (valid, but not recommended)
    {
      code: `
        project.executeTransaction((compoundAction) => {
          const action = trackItem.createMoveAction(tickTime);
          compoundAction.addAction(action);
        });
      `,
    },
  ],

  invalid: [
    // Top-level call
    {
      code: `
        trackItem.createMoveAction(tickTime);
      `,
      errors: [{ messageId: "missingLock" }],
    },
    // Inside a regular function (not lockedAccess)
    {
      code: `
        function doStuff() {
          trackItem.createMoveAction(tickTime);
        }
      `,
      errors: [{ messageId: "missingLock" }],
    },
    // Inside some other callback
    {
      code: `
        someApi.withContext(() => {
          trackItem.createSetInPointAction(tickTime);
        });
      `,
      errors: [{ messageId: "missingLock" }],
    },
    // Multiple violations
    {
      code: `
        trackItem.createMoveAction(tickTime);
        trackItem.createSetNameAction("clip1");
      `,
      errors: [{ messageId: "missingLock" }, { messageId: "missingLock" }],
    },
    // Async callback (action creation may escape the lock scope at runtime)
    {
      code: `
        async function editProject() {
          const action = trackItem.createSetDisabledAction(true);
        }
      `,
      errors: [{ messageId: "missingLock" }],
    },
  ],
});
