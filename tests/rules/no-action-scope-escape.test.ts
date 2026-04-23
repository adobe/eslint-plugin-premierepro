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
import rule from "../../src/rules/no-action-scope-escape";

const ruleTester = new RuleTester();

ruleTester.run("no-action-scope-escape", rule, {
  valid: [
    // Action declared and used inside lockedAccess — normal usage
    {
      code: `
        project.lockedAccess(() => {
          const action = trackItem.createMoveAction(tickTime);
          project.executeTransaction((c) => { c.addAction(action); }, "Edit");
        });
      `,
    },
    // Action created inside nested function, still inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          const makeAction = () => {
            const action = trackItem.createMoveAction(tickTime);
            return action;
          };
          const a = makeAction();
        });
      `,
    },
    // Action created outside lockedAccess entirely (caught by require-locked-access, not this rule)
    {
      code: `
        const action = trackItem.createMoveAction(tickTime);
      `,
    },
    // Variable reassigned inside lockedAccess but declared inside too
    {
      code: `
        project.lockedAccess(() => {
          let action = trackItem.createMoveAction(tickTime);
          action = trackItem.createSetInPointAction(tickTime);
        });
      `,
    },
    // Action created inside executeTransaction, used within same scope
    {
      code: `
        project.executeTransaction((compoundAction) => {
          const action = trackItem.createMoveAction(tickTime);
          compoundAction.addAction(action);
        }, "Move");
      `,
    },
    // Action created inside executeTransaction nested in lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          project.executeTransaction((ca) => {
            const action = trackItem.createMoveAction(tickTime);
            ca.addAction(action);
          }, "Move");
        });
      `,
    },
  ],

  invalid: [
    // Classic escape: outer variable assigned inside lockedAccess
    {
      code: `
        let action;
        project.lockedAccess(() => {
          action = trackItem.createMoveAction(tickTime);
        });
      `,
      errors: [{ messageId: "actionEscapesScope" }],
    },
    // Escape via var (function-scoped but declared outside callback)
    {
      code: `
        var savedAction;
        project.lockedAccess(() => {
          savedAction = trackItem.createSetNameAction("name");
        });
      `,
      errors: [{ messageId: "actionEscapesScope" }],
    },
    // Escape via property assignment on outer object
    {
      code: `
        const state = {};
        project.lockedAccess(() => {
          state.pendingAction = trackItem.createMoveAction(tickTime);
        });
      `,
      errors: [{ messageId: "actionEscapesViaProperty" }],
    },
    // Multiple escapes
    {
      code: `
        let a, b;
        project.lockedAccess(() => {
          a = trackItem.createMoveAction(tickTime);
          b = trackItem.createSetInPointAction(tickTime);
        });
      `,
      errors: [{ messageId: "actionEscapesScope" }, { messageId: "actionEscapesScope" }],
    },
    // Escape via property assignment from executeTransaction
    {
      code: `
        const state = {};
        project.executeTransaction((ca) => {
          state.action = trackItem.createMoveAction(tickTime);
        }, "Move");
      `,
      errors: [{ messageId: "actionEscapesViaProperty" }],
    },
  ],
});
