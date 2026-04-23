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

import { createRule } from "../util/create-rule";
import { isActionType } from "../util/type-guards";

type FunctionNode =
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.ArrowFunctionExpression;

function getCallName(node: TSESTree.CallExpression): string {
  if (
    node.callee.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === TSESTree.AST_NODE_TYPES.Identifier
  ) {
    return node.callee.property.name;
  }
  if (node.callee.type === TSESTree.AST_NODE_TYPES.Identifier) {
    return node.callee.name;
  }
  return "This expression";
}

export default createRule({
  name: "require-action-lock-scope-type-checked",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require calls that return a premierepro Action to be within either a Project.lockedAccess() or Project.executeTransaction() callback",
      recommended: true,
      requiresTypeChecking: true,
    },
    messages: {
      missingLock:
        "{{ callName }}() returns a premierepro Action and must be called within either a Project.lockedAccess() or Project.executeTransaction() callback. " +
        "Action creation requires a locked project state; calling it outside these contexts will throw at runtime.",
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    const services = ESLintUtils.getParserServices(context);
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
      if (isLockedAccessCallback(node)) lockedAccessDepth++;
      if (isExecuteTransactionCallback(node)) executeTransactionDepth++;
    }

    function exitFunction(node: FunctionNode): void {
      if (isLockedAccessCallback(node)) lockedAccessDepth--;
      if (isExecuteTransactionCallback(node)) executeTransactionDepth--;
    }

    return {
      FunctionExpression: enterFunction,
      "FunctionExpression:exit": exitFunction,
      FunctionDeclaration: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      ArrowFunctionExpression: enterFunction,
      "ArrowFunctionExpression:exit": exitFunction,

      CallExpression(node) {
        if (lockedAccessDepth > 0 || executeTransactionDepth > 0) return;

        const returnType = services.getTypeAtLocation(node);
        if (!isActionType(returnType)) return;

        context.report({
          node,
          messageId: "missingLock",
          data: { callName: getCallName(node) },
        });
      },
    };
  },
});
