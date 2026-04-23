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
import rule from "../../src/rules/no-async-in-locked-access";

const ruleTester = new RuleTester();

ruleTester.run("no-async-in-locked-access", rule, {
  valid: [
    // Synchronous code inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          const action = trackItem.createMoveAction(tickTime);
          project.executeTransaction((c) => { c.addAction(action); }, "Edit");
        });
      `,
    },
    // await outside lockedAccess is fine
    {
      code: `
        async function main() {
          const data = await fetchData();
          project.lockedAccess(() => {
            trackItem.createMoveAction(data.time);
          });
        }
      `,
    },
    // setTimeout outside lockedAccess is fine
    {
      code: `
        setTimeout(() => {
          project.lockedAccess(() => {
            trackItem.createMoveAction(tickTime);
          });
        }, 100);
      `,
    },
    // .then() outside lockedAccess is fine
    {
      code: `
        fetchData().then((data) => {
          project.lockedAccess(() => {
            trackItem.createMoveAction(data.time);
          });
        });
      `,
    },
  ],

  invalid: [
    // async callback
    {
      code: `
        project.lockedAccess(async () => {
          const data = await fetchData();
        });
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // async function expression callback
    {
      code: `
        project.lockedAccess(async function () {
          await doWork();
        });
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // setTimeout inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          setTimeout(() => {
            trackItem.createMoveAction(tickTime);
          }, 0);
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // setInterval inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          setInterval(() => {
            doWork();
          }, 1000);
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.then inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          fetchData().then((data) => {
            trackItem.createMoveAction(data.time);
          });
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.catch inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          doWork().catch((err) => {
            console.error(err);
          });
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // queueMicrotask inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          queueMicrotask(() => {
            doWork();
          });
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Nested async function with await inside lockedAccess
    {
      code: `
        project.lockedAccess(() => {
          const run = async () => {
            await doWork();
          };
          run();
        });
      `,
      errors: [{ messageId: "noAwait" }],
    },
  ],
});
