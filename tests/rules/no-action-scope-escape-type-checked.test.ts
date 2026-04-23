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
import rule from "../../src/rules/no-action-scope-escape-type-checked";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
});

ruleTester.run("no-action-scope-escape-type-checked", rule, {
  valid: [
    // Action declared and used inside lockedAccess
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        project.lockedAccess(() => {
          const action = trackItem.createMoveAction(0);
          project.executeTransaction((c) => { c.addAction(action); }, "Edit");
        });
      `,
    },
    // Action created inside nested function, still inside lockedAccess
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        project.lockedAccess(() => {
          const makeAction = () => {
            const action = trackItem.createMoveAction(0);
            return action;
          };
          const a = makeAction();
        });
      `,
    },
    // Non-premierepro call assigned to outer variable -- NOT flagged
    {
      code: `
        type MyAction = { type: string };
        function createMyAction(): MyAction { return { type: "test" }; }
        let action: MyAction | undefined;
        const obj = { lockedAccess: (cb: () => void) => cb() };
        obj.lockedAccess(() => {
          action = createMyAction();
        });
      `,
    },
    // Action created outside lockedAccess (caught by require-locked-access, not this rule)
    {
      code: `
        import { Action } from "@adobe/premierepro";
        declare const trackItem: { createMoveAction(t: number): Action };
        const action = trackItem.createMoveAction(0);
      `,
    },
    // Action created inside executeTransaction, used within same scope
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        project.executeTransaction((compoundAction) => {
          const action = trackItem.createMoveAction(0);
          compoundAction.addAction(action);
        }, "Move");
      `,
    },
    // Action created inside executeTransaction nested in lockedAccess
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        project.lockedAccess(() => {
          project.executeTransaction((ca) => {
            const action = trackItem.createMoveAction(0);
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
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        let action: Action | undefined;
        project.lockedAccess(() => {
          action = trackItem.createMoveAction(0);
        });
      `,
      errors: [{ messageId: "actionEscapesScope" }],
    },
    // Escape via property assignment on outer object
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        const state: { pendingAction?: Action } = {};
        project.lockedAccess(() => {
          state.pendingAction = trackItem.createMoveAction(0);
        });
      `,
      errors: [{ messageId: "actionEscapesViaProperty" }],
    },
    // Wrapper function returning Action escapes to outer variable
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        function buildEdit(): Action { return trackItem.createMoveAction(0); }
        let action: Action | undefined;
        project.lockedAccess(() => {
          action = buildEdit();
        });
      `,
      errors: [{ messageId: "actionEscapesScope" }],
    },
    // Multiple escapes
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: {
          createMoveAction(t: number): Action;
          createSetInPointAction(t: number): Action;
        };
        let a: Action | undefined, b: Action | undefined;
        project.lockedAccess(() => {
          a = trackItem.createMoveAction(0);
          b = trackItem.createSetInPointAction(0);
        });
      `,
      errors: [{ messageId: "actionEscapesScope" }, { messageId: "actionEscapesScope" }],
    },
    // Escape from executeTransaction: outer variable assigned inside transaction
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        let action: Action | undefined;
        project.executeTransaction((compoundAction) => {
          action = trackItem.createMoveAction(0);
        }, "Move");
      `,
      errors: [{ messageId: "actionEscapesScope" }],
    },
    // Escape via property assignment from executeTransaction
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        const state: { action?: Action } = {};
        project.executeTransaction((ca) => {
          state.action = trackItem.createMoveAction(0);
        }, "Move");
      `,
      errors: [{ messageId: "actionEscapesViaProperty" }],
    },
  ],
});
