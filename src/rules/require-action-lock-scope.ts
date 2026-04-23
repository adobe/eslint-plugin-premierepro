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

type Options = [{ actionPattern?: string }];
type MessageIds = "missingLock";

export default createRule<Options, MessageIds>({
  name: "require-action-lock-scope",
  meta: {
    type: "problem",
    defaultOptions: [{ actionPattern: "^create\\w+Action$" }],
    docs: {
      description:
        "Require create*Action() calls to be within either a Project.lockedAccess() or Project.executeTransaction() callback",
      recommended: true,
      requiresTypeChecking: false,
    },
    messages: {
      missingLock:
        "{{ methodName }}() must be called within either a Project.lockedAccess() or Project.executeTransaction() callback. " +
        "Action creation requires a locked project state; calling it outside these contexts will throw at runtime.",
    },
    schema: [
      {
        type: "object",
        properties: {
          actionPattern: {
            type: "string",
            description:
              "Custom regex pattern for method names that require locked access. " +
              "Defaults to ^create\\w+Action$.",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context, [options]) {
    const actionPattern = new RegExp(options.actionPattern || "^create\\w+Action$");

    let lockedAccessDepth = 0;
    let executeTransactionDepth = 0;

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

    function isExecuteTransactionCallback(node: FunctionNode): boolean {
      const parent = node.parent;
      return (
        parent != null &&
        parent.type === TSESTree.AST_NODE_TYPES.CallExpression &&
        parent.callee.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
        parent.callee.property.type === TSESTree.AST_NODE_TYPES.Identifier &&
        parent.callee.property.name === "executeTransaction" &&
        parent.arguments[0] === node
      );
    }

    function enterFunction(node: FunctionNode): void {
      if (isLockedAccessCallback(node)) {
        lockedAccessDepth++;
      }
      if (isExecuteTransactionCallback(node)) {
        executeTransactionDepth++;
      }
    }

    function exitFunction(node: FunctionNode): void {
      if (isLockedAccessCallback(node)) {
        lockedAccessDepth--;
      }
      if (isExecuteTransactionCallback(node)) {
        executeTransactionDepth--;
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
          actionPattern.test(node.callee.property.name) &&
          lockedAccessDepth === 0 &&
          executeTransactionDepth === 0
        ) {
          context.report({
            node,
            messageId: "missingLock",
            data: { methodName: node.callee.property.name },
          });
        }
      },
    };
  },
});
