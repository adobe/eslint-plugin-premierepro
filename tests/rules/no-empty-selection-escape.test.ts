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
import rule from "../../src/rules/no-empty-selection-escape";

const ruleTester = new RuleTester();

ruleTester.run("no-empty-selection-escape", rule, {
  valid: [
    // Selection used only inside the callback
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          selection.addItem(trackItem);
        });
      `,
    },
    // Selection passed into a nested function still inside the callback
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          const addAll = () => {
            selection.addItem(trackItem);
          };
          addAll();
        });
      `,
    },
    // Unrelated variable assigned inside the callback -- NOT flagged
    {
      code: `
        let count;
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          selection.addItem(trackItem);
          count = 1;
        });
      `,
    },
    // The rule matches createEmptySelection() calls by name (syntactic, no type info), but only
    // reports when the parameter itself is what gets assigned outside the callback
    {
      code: `
        const other = { createEmptySelection: (cb) => cb({}) };
        let saved;
        other.createEmptySelection((selection) => {
          saved = 1;
        });
      `,
    },
    // Selection reassigned to a local declared inside the same callback
    {
      code: `
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          const local = selection;
          local.addItem(trackItem);
        });
      `,
    },
  ],

  invalid: [
    // Classic escape: outer variable assigned the selection parameter
    {
      code: `
        let saved;
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          saved = selection;
        });
        saved.addItem(trackItem);
      `,
      errors: [{ messageId: "selectionEscapesScope" }],
    },
    // Escape via var (function-scoped but declared outside callback)
    {
      code: `
        var savedSelection;
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          savedSelection = selection;
        });
      `,
      errors: [{ messageId: "selectionEscapesScope" }],
    },
    // Escape via property assignment on outer object
    {
      code: `
        const state = {};
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          state.selection = selection;
        });
      `,
      errors: [{ messageId: "selectionEscapesViaProperty" }],
    },
    // Escape via renamed parameter
    {
      code: `
        let saved;
        ppro.TrackItemSelection.createEmptySelection((emptySelection) => {
          saved = emptySelection;
        });
      `,
      errors: [{ messageId: "selectionEscapesScope" }],
    },
  ],
});
