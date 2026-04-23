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

import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

import type { Type } from "typescript";

import { createRule } from "../util/create-rule";
import { isProjectType } from "../util/type-guards";

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
  name: "no-async-in-execute-transaction-type-checked",
  meta: {
    type: "problem",
    docs: {
      description: "Disallow async operations inside premierepro Project.executeTransaction() callbacks",
      recommended: true,
      requiresTypeChecking: true,
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
    const services = ESLintUtils.getParserServices(context);
    let transactionDepth = 0;

    function isExecuteTransactionCallback(node: FunctionNode): boolean {
      const parent = node.parent;
      if (
        parent == null ||
        parent.type !== TSESTree.AST_NODE_TYPES.CallExpression ||
        parent.callee.type !== TSESTree.AST_NODE_TYPES.MemberExpression ||
        parent.callee.property.type !== TSESTree.AST_NODE_TYPES.Identifier ||
        parent.callee.property.name !== "executeTransaction" ||
        parent.arguments[0] !== node
      ) {
        return false;
      }

      const receiverType = services.getTypeAtLocation(parent.callee.object);
      return isProjectType(receiverType);
    }

    function isPromiseType(type: Type): boolean {
      const symbol = type.getSymbol();
      if (symbol?.getName() === "Promise") return true;

      const baseTypes = type.getBaseTypes?.();
      if (baseTypes) {
        return baseTypes.some((base) => isPromiseType(base));
      }
      return false;
    }

    function isThenableCall(node: TSESTree.CallExpression): boolean {
      if (
        node.callee.type !== TSESTree.AST_NODE_TYPES.MemberExpression ||
        node.callee.property.type !== TSESTree.AST_NODE_TYPES.Identifier ||
        !PROMISE_METHODS.has(node.callee.property.name)
      ) {
        return false;
      }

      const receiverType = services.getTypeAtLocation(node.callee.object);
      return isPromiseType(receiverType);
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

        if (isThenableCall(node)) {
          context.report({
            node,
            messageId: "noDeferredExecution",
            data: {
              name: (node.callee as TSESTree.MemberExpression & { property: TSESTree.Identifier })
                .property.name,
            },
          });
        }
      },
    };
  },
});
