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

import { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../util/create-rule";

export default createRule({
  name: "prefer-undo-string",
  meta: {
    type: "suggestion",
    docs: {
      description: "Suggest providing an undo string when calling executeTransaction()",
      recommended: false,
      requiresTypeChecking: false,
    },
    messages: {
      missingUndoString:
        "executeTransaction() should include a descriptive undo string as the second argument " +
        "so users see a meaningful label in Edit > Undo.",
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === TSESTree.AST_NODE_TYPES.Identifier &&
          node.callee.property.name === "executeTransaction" &&
          node.arguments.length < 2
        ) {
          context.report({
            node,
            messageId: "missingUndoString",
          });
        }
      },
    };
  },
});
