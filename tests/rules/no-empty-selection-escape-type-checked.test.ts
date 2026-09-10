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
import rule from "../../src/rules/no-empty-selection-escape-type-checked";

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
});

ruleTester.run("no-empty-selection-escape-type-checked", rule, {
  valid: [
    // Selection used only inside the callback
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
    // Selection passed into a nested function still inside the callback
    {
      code: `
        import type { premierepro, VideoClipTrackItem } from "@adobe/premierepro";
        declare const ppro: premierepro;
        declare const trackItem: VideoClipTrackItem;
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          const addAll = () => {
            selection.addItem(trackItem);
          };
          addAll();
        });
      `,
    },
    // A same-named method on a non-premierepro object -- NOT flagged
    {
      code: `
        const other = {
          createEmptySelection(cb: (selection: { addItem(x: unknown): void }) => void) {
            cb({ addItem: () => {} });
          },
        };
        let saved: unknown;
        other.createEmptySelection((selection) => {
          saved = selection;
        });
      `,
    },
    // Unrelated variable assigned inside the callback -- NOT flagged
    {
      code: `
        import type { premierepro, VideoClipTrackItem } from "@adobe/premierepro";
        declare const ppro: premierepro;
        declare const trackItem: VideoClipTrackItem;
        let count: number | undefined;
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          selection.addItem(trackItem);
          count = 1;
        });
      `,
    },
  ],

  invalid: [
    // Classic escape: outer variable assigned the selection parameter
    {
      code: `
        import type { premierepro, TrackItemSelection } from "@adobe/premierepro";
        declare const ppro: premierepro;
        let saved: TrackItemSelection | undefined;
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          saved = selection;
        });
      `,
      errors: [{ messageId: "selectionEscapesScope" }],
    },
    // Escape via property assignment on outer object
    {
      code: `
        import type { premierepro, TrackItemSelection } from "@adobe/premierepro";
        declare const ppro: premierepro;
        const state: { selection?: TrackItemSelection } = {};
        ppro.TrackItemSelection.createEmptySelection((selection) => {
          state.selection = selection;
        });
      `,
      errors: [{ messageId: "selectionEscapesViaProperty" }],
    },
    // Escape via renamed parameter
    {
      code: `
        import type { premierepro, TrackItemSelection } from "@adobe/premierepro";
        declare const ppro: premierepro;
        let saved: TrackItemSelection | undefined;
        ppro.TrackItemSelection.createEmptySelection((emptySelection) => {
          saved = emptySelection;
        });
      `,
      errors: [{ messageId: "selectionEscapesScope" }],
    },
  ],
});
