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

export default createRule({
  name: "require-execute-transaction",
  meta: {
    type: "problem",
    docs: {
      description: "Require addAction() calls to be within a Project.executeTransaction() callback",
      recommended: true,
      requiresTypeChecking: false,
    },
    messages: {
      missingExecuteTransaction:
        "addAction() must be called within a Project.executeTransaction() callback. " +
        "The compound action is only valid inside the transaction that created it.",
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    let transactionDepth = 0;

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
      if (isExecuteTransactionCallback(node)) transactionDepth++;
    }

    function exitFunction(node: FunctionNode): void {
      if (isExecuteTransactionCallback(node)) transactionDepth--;
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
          node.callee.property.name === "addAction" &&
          transactionDepth === 0
        ) {
          context.report({
            node,
            messageId: "missingExecuteTransaction",
          });
        }
      },
    };
  },
});
