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
import rule from "../../src/rules/no-async-in-locked-access-type-checked";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
});

ruleTester.run("no-async-in-locked-access-type-checked", rule, {
  valid: [
    // Synchronous code inside lockedAccess
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
    // await outside lockedAccess is fine
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        async function main() {
          const data = await Promise.resolve({ time: 0 });
          project.lockedAccess(() => {
            console.log(data.time);
          });
        }
      `,
    },
    // .lockedAccess() on a non-Project object -- NOT flagged
    {
      code: `
        const db = {
          lockedAccess(cb: () => void) { cb(); },
        };
        db.lockedAccess(async () => {
          await Promise.resolve();
        });
      `,
    },
    // .then() on a non-Promise object inside lockedAccess -- NOT flagged
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        const handler = {
          then(cb: () => void) { cb(); },
        };
        project.lockedAccess(() => {
          handler.then(() => { console.log("sync"); });
        });
      `,
    },
    // setTimeout outside lockedAccess is fine
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        setTimeout(() => {
          project.lockedAccess(() => {
            console.log("ok");
          });
        }, 100);
      `,
    },
  ],

  invalid: [
    // async callback on premierepro Project
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.lockedAccess(async () => {
          const data = await Promise.resolve(42);
        });
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // async function expression callback
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.lockedAccess(async function () {
          await Promise.resolve();
        });
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // setTimeout inside lockedAccess
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.lockedAccess(() => {
          setTimeout(() => {
            console.log("deferred");
          }, 0);
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // setInterval inside lockedAccess
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.lockedAccess(() => {
          setInterval(() => {
            console.log("deferred");
          }, 1000);
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.then inside lockedAccess
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.lockedAccess(() => {
          Promise.resolve(42).then((data) => {
            console.log(data);
          });
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.catch inside lockedAccess
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.lockedAccess(() => {
          Promise.reject(new Error("fail")).catch((err) => {
            console.error(err);
          });
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // queueMicrotask inside lockedAccess
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.lockedAccess(() => {
          queueMicrotask(() => {
            console.log("micro");
          });
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Nested async function with await inside lockedAccess
    {
      code: `
        import { Project } from "@adobe/premierepro";
        declare const project: Project;
        project.lockedAccess(() => {
          const run = async () => {
            await Promise.resolve();
          };
          run();
        });
      `,
      errors: [{ messageId: "noAwait" }],
    },
  ],
});
