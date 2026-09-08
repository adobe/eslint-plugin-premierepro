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
import rule from "../../src/rules/no-async-in-empty-selection";

const ruleTester = new RuleTester();

ruleTester.run("no-async-in-empty-selection", rule, {
  valid: [
    // Synchronous code inside createEmptySelection
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          selection.addItem(trackItem);
        });
      `,
    },
    // await outside createEmptySelection is fine
    {
      code: `
        async function main() {
          const data = await fetchData();
          ppro.TrackItemSelection.createEmptySelection((selection) => {
            selection.addItem(data.trackItem);
          });
        }
      `,
    },
    // setTimeout outside createEmptySelection is fine
    {
      code: `
        setTimeout(() => {
          ppro.TrackItemSelection.createEmptySelection((selection) => {
            selection.addItem(trackItem);
          });
        }, 100);
      `,
    },
    // .then() outside createEmptySelection is fine
    {
      code: `
        fetchData().then((data) => {
          ppro.TrackItemSelection.createEmptySelection((selection) => {
            selection.addItem(data.trackItem);
          });
        });
      `,
    },
  ],

  invalid: [
    // async callback
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection(async (selection) => {
          const data = await fetchData();
        });
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // async function expression callback
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection(async function (selection) {
          await doWork();
        });
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // setTimeout inside createEmptySelection
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          setTimeout(() => {
            selection.addItem(trackItem);
          }, 0);
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.then inside createEmptySelection
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          fetchData().then((data) => {
            selection.addItem(data.trackItem);
          });
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // queueMicrotask inside createEmptySelection
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          queueMicrotask(() => {
            selection.addItem(trackItem);
          });
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Nested async function with await inside createEmptySelection
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          const run = async () => {
            await doWork();
          };
          run();
        });
      `,
      errors: [{ messageId: "noAwait" }],
    },
    // Simple await inside createEmptySelection
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          await doWork();
        });
      `,
      errors: [{ messageId: "noAwait" }],
    },
  ],
});
