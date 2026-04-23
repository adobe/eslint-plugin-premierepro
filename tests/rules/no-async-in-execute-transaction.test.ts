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
import rule from "../../src/rules/no-async-in-execute-transaction";

const ruleTester = new RuleTester();

ruleTester.run("no-async-in-execute-transaction", rule, {
  valid: [
    // Synchronous code inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          const action = trackItem.createMoveAction(tickTime);
          compoundAction.addAction(action);
        }, "Move clip");
      `,
    },
    // await outside executeTransaction is fine
    {
      code: `
        async function main() {
          const data = await fetchData();
          project.executeTransaction((compoundAction) => {
            const action = trackItem.createMoveAction(data.time);
            compoundAction.addAction(action);
          }, "Move clip");
        }
      `,
    },
    // setTimeout outside executeTransaction is fine
    {
      code: `
        setTimeout(() => {
          project.executeTransaction((compoundAction) => {
            const action = trackItem.createMoveAction(tickTime);
            compoundAction.addAction(action);
          }, "Move clip");
        }, 100);
      `,
    },
    // .then() outside executeTransaction is fine
    {
      code: `
        fetchData().then((data) => {
          project.executeTransaction((compoundAction) => {
            const action = trackItem.createMoveAction(data.time);
            compoundAction.addAction(action);
          }, "Move clip");
        });
      `,
    },
    // Multiple actions in transaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          const action1 = trackItem.createMoveAction(tickTime);
          const action2 = trackItem2.createScaleAction(scaleX);
          compoundAction.addAction(action1);
          compoundAction.addAction(action2);
        }, "Move and scale");
      `,
    },
  ],

  invalid: [
    // async callback
    {
      code: `
        project.executeTransaction(async (compoundAction) => {
          const data = await fetchData();
        }, "Move clip");
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // async function expression callback
    {
      code: `
        project.executeTransaction(async function (compoundAction) {
          await doWork();
        }, "Move clip");
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // setTimeout inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          setTimeout(() => {
            const action = trackItem.createMoveAction(tickTime);
            compoundAction.addAction(action);
          }, 0);
        }, "Move clip");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // setInterval inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          setInterval(() => {
            doWork();
          }, 1000);
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.then inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          fetchData().then((data) => {
            const action = trackItem.createMoveAction(data.time);
            compoundAction.addAction(action);
          });
        }, "Move clip");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.catch inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          doWork().catch((err) => {
            console.error(err);
          });
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.finally inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          doWork().finally(() => {
            cleanup();
          });
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // queueMicrotask inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          queueMicrotask(() => {
            doWork();
          });
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // requestAnimationFrame inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          requestAnimationFrame(() => {
            doWork();
          });
        }, "Work");
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Nested async function with await inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          const run = async () => {
            await doWork();
          };
          run();
        }, "Work");
      `,
      errors: [{ messageId: "noAwait" }],
    },
    // Simple await inside executeTransaction
    {
      code: `
        project.executeTransaction((compoundAction) => {
          await doWork();
        }, "Work");
      `,
      errors: [{ messageId: "noAwait" }],
    },
  ],
});
