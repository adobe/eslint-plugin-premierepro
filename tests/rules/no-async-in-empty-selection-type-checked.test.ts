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
import rule from "../../src/rules/no-async-in-empty-selection-type-checked";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
});

ruleTester.run("no-async-in-empty-selection-type-checked", rule, {
  valid: [
    // Synchronous code inside createEmptySelection
    {
      code: `
        import type { premierepro, VideoClipTrackItem } from "@adobe/premierepro";
        declare const ppro: premierepro;
        declare const trackItem: VideoClipTrackItem;
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          selection.addItem(trackItem);
        });
      `,
    },
    // await outside createEmptySelection is fine
    {
      code: `
        import type { premierepro } from "@adobe/premierepro";
        declare const ppro: premierepro;
        async function main() {
          const data = await Promise.resolve({ trackItem: undefined });
          ppro.TrackItemSelection.createEmptySelection((selection) => {
            console.log(data);
          });
        }
      `,
    },
    // .createEmptySelection() on a non-premierepro object -- NOT flagged
    {
      code: `
        const other = {
          createEmptySelection(cb: (selection: unknown) => void) {
            cb({});
          },
        };
        other.createEmptySelection(async (selection) => {
          await Promise.resolve();
        });
      `,
    },
  ],

  invalid: [
    // async callback with await
    {
      code: `
        import type { premierepro } from "@adobe/premierepro";
        declare const ppro: premierepro;
        ppro.TrackItemSelection.createEmptySelection(async (selection) => {
          const data = await Promise.resolve({ trackItem: undefined });
        });
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // async function expression callback
    {
      code: `
        import type { premierepro } from "@adobe/premierepro";
        declare const ppro: premierepro;
        ppro.TrackItemSelection.createEmptySelection(async function (selection) {
          await Promise.resolve();
        });
      `,
      errors: [{ messageId: "noAsyncCallback" }, { messageId: "noAwait" }],
    },
    // setTimeout inside createEmptySelection
    {
      code: `
        import type { premierepro } from "@adobe/premierepro";
        declare const ppro: premierepro;
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          setTimeout(() => {
            console.log("delayed");
          }, 0);
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // Promise.then inside createEmptySelection
    {
      code: `
        import type { premierepro } from "@adobe/premierepro";
        declare const ppro: premierepro;
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          Promise.resolve({ data: "test" }).then((data) => {
            console.log(data);
          });
        });
      `,
      errors: [{ messageId: "noDeferredExecution" }],
    },
    // await inside createEmptySelection
    {
      code: `
        import type { premierepro } from "@adobe/premierepro";
        declare const ppro: premierepro;
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          await Promise.resolve();
        });
      `,
      errors: [{ messageId: "noAwait" }],
    },
  ],
});
