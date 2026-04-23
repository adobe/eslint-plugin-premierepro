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

import { ESLintUtils, TSESTree, TSESLint } from "@typescript-eslint/utils";

import { createRule } from "../util/create-rule";
import { isActionType } from "../util/type-guards";

type FunctionNode =
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.ArrowFunctionExpression;

type MessageIds = "actionEscapesScope" | "actionEscapesViaProperty";

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

export default createRule<[], MessageIds>({
  name: "no-action-scope-escape-type-checked",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow premierepro Action objects from escaping the lock scope they were created in (lockedAccess() or executeTransaction())",
      recommended: true,
      requiresTypeChecking: true,
    },
    messages: {
      actionEscapesScope:
        "{{ callName }}() returns a premierepro Action and its result is assigned to a variable " +
        "declared outside the lock scope (lockedAccess() or executeTransaction() callback). Actions are only valid within the locked " +
        "scope where they were created.",
      actionEscapesViaProperty:
        "{{ callName }}() returns a premierepro Action and its result is stored on an object " +
        "declared outside the lock scope (lockedAccess() or executeTransaction() callback). Actions are only valid within the locked " +
        "scope where they were created.",
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const sourceCode = context.sourceCode;
    const lockedCallbackStack: FunctionNode[] = [];

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

    function isActionReturningCall(node: TSESTree.Node): node is TSESTree.CallExpression {
      if (node.type !== TSESTree.AST_NODE_TYPES.CallExpression) return false;
      const returnType = services.getTypeAtLocation(node);
      return isActionType(returnType);
    }

    function isInsideNode(inner: TSESTree.Node, outer: TSESTree.Node): boolean {
      let current: TSESTree.Node | undefined = inner;
      while (current) {
        if (current === outer) return true;
        current = current.parent;
      }
      return false;
    }

    function findVariable(
      scope: TSESLint.Scope.Scope,
      name: string
    ): TSESLint.Scope.Variable | null {
      let s: TSESLint.Scope.Scope | null = scope;
      while (s) {
        const found = s.variables.find((v) => v.name === name);
        if (found) return found;
        s = s.upper;
      }
      return null;
    }

    function enterFunction(node: FunctionNode): void {
      if (isLockedAccessCallback(node) || isExecuteTransactionCallback(node)) {
        lockedCallbackStack.push(node);
      }
    }

    function exitFunction(node: FunctionNode): void {
      if (isLockedAccessCallback(node) || isExecuteTransactionCallback(node)) {
        lockedCallbackStack.pop();
      }
    }

    function checkAssignment(
      node: TSESTree.AssignmentExpression,
      assignmentTarget: TSESTree.Node,
      rhs: TSESTree.Node
    ): void {
      if (lockedCallbackStack.length === 0) return;
      if (!isActionReturningCall(rhs)) return;

      const currentCallback = lockedCallbackStack[lockedCallbackStack.length - 1];
      const callName = getCallName(rhs);

      if (assignmentTarget.type === TSESTree.AST_NODE_TYPES.Identifier) {
        const scope = sourceCode.getScope(node);
        const variable = findVariable(scope, assignmentTarget.name);

        if (variable && variable.defs.length > 0) {
          const defNode = variable.defs[0].node;
          if (!isInsideNode(defNode, currentCallback)) {
            context.report({
              node,
              messageId: "actionEscapesScope",
              data: { callName },
            });
          }
        }
        return;
      }

      if (
        assignmentTarget.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
        assignmentTarget.object.type === TSESTree.AST_NODE_TYPES.Identifier
      ) {
        const scope = sourceCode.getScope(node);
        const variable = findVariable(scope, assignmentTarget.object.name);

        if (variable && variable.defs.length > 0) {
          const defNode = variable.defs[0].node;
          if (!isInsideNode(defNode, currentCallback)) {
            context.report({
              node,
              messageId: "actionEscapesViaProperty",
              data: { callName },
            });
          }
        }
      }
    }

    return {
      FunctionExpression: enterFunction,
      "FunctionExpression:exit": exitFunction,
      FunctionDeclaration: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      ArrowFunctionExpression: enterFunction,
      "ArrowFunctionExpression:exit": exitFunction,

      AssignmentExpression(node) {
        checkAssignment(node, node.left, node.right);
      },
    };
  },
});
