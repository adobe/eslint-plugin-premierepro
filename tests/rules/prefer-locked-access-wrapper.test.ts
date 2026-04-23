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
import rule from "../../src/rules/prefer-locked-access-wrapper";

const ruleTester = new RuleTester();

ruleTester.run("prefer-locked-access-wrapper", rule, {
  valid: [
    // executeTransaction inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          project.executeTransaction((compoundAction) => {
            const action = trackItem.createMoveAction(tickTime);
            compoundAction.addAction(action);
          }, "Move clip");
        });
      `,
    },
    // lockedAccess without executeTransaction
    {
      code: `
        project.lockedAccess(() => {
          trackItem.createMoveAction(tickTime);
        });
      `,
    },
  ],

  invalid: [
    // Bare executeTransaction at top level
    {
      code: `
        project.executeTransaction((compoundAction) => {
          const action = trackItem.createMoveAction(tickTime);
          compoundAction.addAction(action);
        }, "My Undo String");
      `,
      errors: [{ messageId: "preferNested" }],
    },
    // Multiple bare executeTransaction calls
    {
      code: `
        project.executeTransaction((ca) => {
          trackItem.createMoveAction(0);
        }, "First");
        project.executeTransaction((ca) => {
          trackItem.createSetNameAction("test");
        }, "Second");
      `,
      errors: [{ messageId: "preferNested" }, { messageId: "preferNested" }],
    },
  ],
});
