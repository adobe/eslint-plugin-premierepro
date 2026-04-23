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

type FunctionNode =
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.ArrowFunctionExpression;

type MessageIds = "preferNested";

export default createRule<[], MessageIds>({
  name: "prefer-locked-access-wrapper",
  meta: {
    type: "suggestion",
    docs: {
      description: "Recommend wrapping executeTransaction() in lockedAccess() for clearer intent and better code organization",
      recommended: false,
      requiresTypeChecking: false,
    },
    messages: {
      preferNested:
        "Consider wrapping executeTransaction() in a lockedAccess() callback. " +
        "This pattern is clearer and keeps action creation and transaction handling in the same lock scope.",
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    let lockedAccessDepth = 0;

    function isLockedAccessCallback(node: FunctionNode): boolean {
      const parent = node.parent;
      return (
        parent != null &&
        parent.type === TSESTree.AST_NODE_TYPES.CallExpression &&
        parent.callee.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
        parent.callee.property.type === TSESTree.AST_NODE_TYPES.Identifier &&
        parent.callee.property.name === "lockedAccess" &&
        parent.arguments[0] === node
      );
    }

    function enterFunction(node: FunctionNode): void {
      if (isLockedAccessCallback(node)) {
        lockedAccessDepth++;
      }
    }

    function exitFunction(node: FunctionNode): void {
      if (isLockedAccessCallback(node)) {
        lockedAccessDepth--;
      }
    }

    return {
      FunctionExpression: enterFunction,
      "FunctionExpression:exit": exitFunction,
      FunctionDeclaration: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      ArrowFunctionExpression: enterFunction,
      "ArrowFunctionExpression:exit": exitFunction,

      CallExpression(node) {
        if (
          node.callee.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === TSESTree.AST_NODE_TYPES.Identifier &&
          node.callee.property.name === "executeTransaction" &&
          lockedAccessDepth === 0
        ) {
          context.report({
            node,
            messageId: "preferNested",
          });
        }
      },
    };
  },
});
