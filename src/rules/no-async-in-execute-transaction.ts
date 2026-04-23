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

const DEFERRED_FUNCTIONS = new Set([
  "setTimeout",
  "setInterval",
  "setImmediate",
  "requestAnimationFrame",
  "requestIdleCallback",
  "queueMicrotask",
]);

const PROMISE_METHODS = new Set(["then", "catch", "finally"]);

type MessageIds = "noAsyncCallback" | "noAwait" | "noDeferredExecution";

export default createRule<[], MessageIds>({
  name: "no-async-in-execute-transaction",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow async operations inside executeTransaction() callbacks",
      recommended: true,
      requiresTypeChecking: false,
    },
    messages: {
      noAsyncCallback:
        "executeTransaction() callback must not be async. " +
        "The transaction is synchronous and will complete before async operations execute.",
      noAwait:
        "await is not allowed inside executeTransaction(). " +
        "The transaction is synchronous and will complete before the awaited operation executes.",
      noDeferredExecution:
        "{{ name }}() is not allowed inside executeTransaction(). " +
        "The transaction is synchronous and will complete before the deferred callback executes.",
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
      if (isExecuteTransactionCallback(node)) {
        transactionDepth++;
        if (node.async) {
          context.report({ node, messageId: "noAsyncCallback" });
        }
      }
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

      AwaitExpression(node) {
        if (transactionDepth > 0) {
          context.report({ node, messageId: "noAwait" });
        }
      },

      CallExpression(node) {
        if (transactionDepth === 0) return;

        if (
          node.callee.type === TSESTree.AST_NODE_TYPES.Identifier &&
          DEFERRED_FUNCTIONS.has(node.callee.name)
        ) {
          context.report({
            node,
            messageId: "noDeferredExecution",
            data: { name: node.callee.name },
          });
          return;
        }

        if (
          node.callee.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === TSESTree.AST_NODE_TYPES.Identifier &&
          PROMISE_METHODS.has(node.callee.property.name)
        ) {
          context.report({
            node,
            messageId: "noDeferredExecution",
            data: { name: node.callee.property.name },
          });
        }
      },
    };
  },
});
