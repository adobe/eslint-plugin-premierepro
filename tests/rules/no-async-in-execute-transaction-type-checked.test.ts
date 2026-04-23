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
import rule from "../../src/rules/no-async-in-execute-transaction-type-checked";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
});

ruleTester.run("no-async-in-execute-transaction-type-checked", rule, {
  valid: [
    // Synchronous code inside executeTransaction
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        project.executeTransaction((compoundAction) => {
          const action = trackItem.createMoveAction(0);
          compoundAction.addAction(action);
        }, "Move clip");
      `,
    },
    // await outside executeTransaction is fine
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        async function main() {
          const data = await Promise.resolve({ time: 0 });
          project.executeTransaction((compoundAction) => {
            console.log(data.time);
          }, "Work");
        }
      `,
    },
    // .executeTransaction() on a non-Project object -- NOT flagged
    {
      code: `
        const db = {
          executeTransaction(cb: (tx: any) => void, msg: string) { cb({}); },
        };
        db.executeTransaction(async (tx) => {
          await doWork();
        }, "Work");
      `,
    },
    // Multiple actions in transaction
    {
      code: `
        import { Project, Action } from "@adobe/premierepro";
        declare const project: Project;
        declare const trackItem: { createMoveAction(t: number): Action };
        declare const trackItem2: { createScaleAction(s: number): Action };
        project.executeTransaction((compoundAction) => {
          const action1 = trackItem.createMoveAction(0);
          const action2 = trackItem2.createScaleAction(1.5);
          compoundAction.addAction(action1);
          compoundAction.addAction(action2);
        }, "Move and scale");
      `,
    },
  ],

  invalid: [
    // async callback with await
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction(async (compoundAction) => {
          const data = await Promise.resolve({ time: 0 });
        }, "Work");
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // async function expression callback
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction(async function (compoundAction) {
          await Promise.resolve();
        }, "Work");
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // setTimeout inside executeTransaction
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          setTimeout(() => {
            console.log("delayed");
          }, 0);
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // setInterval inside executeTransaction
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          setInterval(() => {
            console.log("periodic");
          }, 1000);
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.then inside executeTransaction
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          Promise.resolve({ data: "test" }).then((data) => {
            console.log(data);
          });
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.catch inside executeTransaction
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          Promise.reject(new Error("test")).catch((err) => {
            console.error(err);
          });
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.finally inside executeTransaction
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          Promise.resolve().finally(() => {
            cleanup();
          });
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // queueMicrotask inside executeTransaction
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          queueMicrotask(() => {
            console.log("microtask");
          });
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // requestIdleCallback inside executeTransaction
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          requestIdleCallback(() => {
            console.log("idle");
          });
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // await inside executeTransaction
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.executeTransaction((compoundAction) => {
          await Promise.resolve();
        }, "Work");
      `,
      errors: [{ messageId: "noAwait" }],
    },
  ],
});
