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
import rule from "../../src/rules/require-execute-transaction-type-checked";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
});

ruleTester.run("require-execute-transaction-type-checked", rule, {
  valid: [
    // addAction on CompoundAction inside executeTransaction
    {
      code: `
        import { Project, CompoundAction, Action } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction: CompoundAction) => {
          compoundAction.addAction({} as Action);
        }, "Edit");
      `,
    },
    // addAction on CompoundAction inferred from executeTransaction callback parameter
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((ca) => {
          ca.addAction({} as any);
        }, "Edit");
      `,
    },
    // addAction on a non-premierepro object -- should NOT be flagged
    {
      code: `
        const list = { addAction: (item: string) => {} };
        list.addAction("hello");
      `,
    },
    // addAction on an array-like custom object -- should NOT be flagged
    {
      code: `
        interface ActionQueue { addAction(a: unknown): void; }
        declare const queue: ActionQueue;
        queue.addAction({});
      `,
    },
    // Unrelated method call
    {
      code: `
        const obj = { doSomething: () => {} };
        obj.doSomething();
      `,
    },
  ],

  invalid: [
    // addAction on CompoundAction outside executeTransaction
    {
      code: `
        import { CompoundAction, Action } from "@adobe/premierepro";
        declare const ca: CompoundAction;
        ca.addAction({} as Action);
      `,
      errors: [{ messageId: "missingExecuteTransaction" }],
    },
    // addAction on CompoundAction inside lockedAccess but not executeTransaction
    {
      code: `
        import { Project, CompoundAction, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const ca: CompoundAction;
        project.lockedAccess(() => {
          ca.addAction({} as Action);
        });
      `,
      errors: [{ messageId: "missingExecuteTransaction" }],
    },
    // addAction on CompoundAction in a regular function
    {
      code: `
        import { CompoundAction, Action } from "@adobe/premierepro";
        function apply(ca: CompoundAction, action: Action) {
          ca.addAction(action);
        }
      `,
      errors: [{ messageId: "missingExecuteTransaction" }],
    },
  ],
});
