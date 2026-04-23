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
import rule from "../../src/rules/require-action-lock-scope-type-checked";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
});

ruleTester.run("require-action-lock-scope-type-checked", rule, {
  valid: [
    // Action-returning call inside lockedAccess
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        project.lockedAccess(() => {
          trackItem.createMoveAction(0);
        });
      `,
    },
    // Nested inside executeTransaction within lockedAccess
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        project.lockedAccess(() => {
          project.executeTransaction((ca) => {
            const action = trackItem.createMoveAction(0);
            ca.addAction(action);
          });
        });
      `,
    },
    // Non-premierepro function that returns a different object -- NOT flagged
    {
      code: `
        type MyAction = { type: string };
        function createMyAction(): MyAction { return { type: "test" }; }
        createMyAction();
      `,
    },
    // Method returning a non-Action type -- NOT flagged
    {
      code: `
        const builder = { createAction: (): string => "done" };
        builder.createAction();
      `,
    },
    // Unrelated calls
    {
      code: `
        console.log("hello");
        Math.random();
      `,
    },
    // Bare executeTransaction (valid, but not recommended)
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        project.executeTransaction((ca) => {
          const action = trackItem.createMoveAction(0);
          ca.addAction(action);
        });
      `,
    },
  ],

  invalid: [
    // Direct Action-returning call at top level
    {
      code: `
        import { Action } from "@adobe/premierepro";
        declare const trackItem: { createMoveAction(t: number): Action };
        trackItem.createMoveAction(0);
      `,
      errors: [{ messageId: "missingLock" }],
    },
    // Inside a regular function (not lockedAccess)
    {
      code: `
        import { Action } from "@adobe/premierepro";
        declare const trackItem: { createMoveAction(t: number): Action };
        function doStuff() {
          trackItem.createMoveAction(0);
        }
      `,
      errors: [{ messageId: "missingLock" }],
    },
    // Wrapper function returning Action -- caught by type checking
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const trackItem: { createMoveAction(t: number): Action };
        function buildEdit(): Action {
          return trackItem.createMoveAction(0);
        }
        buildEdit();
      `,
      errors: [{ messageId: "missingLock" }, { messageId: "missingLock" }],
    },
    // Multiple violations
    {
      code: `
        import { Action } from "@adobe/premierepro";
        declare const trackItem: {
          createMoveAction(t: number): Action;
          createSetNameAction(n: string): Action;
        };
        trackItem.createMoveAction(0);
        trackItem.createSetNameAction("clip1");
      `,
      errors: [{ messageId: "missingLock" }, { messageId: "missingLock" }],
    },
  ],
});
