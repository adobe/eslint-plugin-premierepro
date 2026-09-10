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

import { TSESTree, TSESLint } from "@typescript-eslint/utils";

import { createRule } from "../util/create-rule";

type FunctionNode =
  | TSESTree.FunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.ArrowFunctionExpression;

type CallbackFrame = {
  node: FunctionNode;
  paramVariable: TSESLint.Scope.Variable | null;
};

type MessageIds = "selectionEscapesScope" | "selectionEscapesViaProperty";

export default createRule<[], MessageIds>({
  name: "no-empty-selection-escape",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow the TrackItemSelection.createEmptySelection() callback parameter from escaping the callback",
      recommended: true,
      requiresTypeChecking: false,
    },
    messages: {
      selectionEscapesScope:
        "The createEmptySelection() callback parameter is assigned to a variable declared " +
        "outside the callback. The selection is only valid within the callback where it was provided.",
      selectionEscapesViaProperty:
        "The createEmptySelection() callback parameter is stored on an object declared " +
        "outside the callback. The selection is only valid within the callback where it was provided.",
    },
    schema: [],
  },
  defaultOptions: [],

  create(context) {
    const sourceCode = context.sourceCode;
    const callbackStack: CallbackFrame[] = [];

    function isCreateEmptySelectionCallback(node: FunctionNode): boolean {
      const parent = node.parent;
      return (
        parent != null &&
        parent.type === TSESTree.AST_NODE_TYPES.CallExpression &&
        parent.callee.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
        parent.callee.property.type === TSESTree.AST_NODE_TYPES.Identifier &&
        parent.callee.property.name === "createEmptySelection" &&
        parent.arguments[0] === node
      );
    }

    function getParamVariable(node: FunctionNode): TSESLint.Scope.Variable | null {
      const param = node.params[0];
      if (param == null || param.type !== TSESTree.AST_NODE_TYPES.Identifier) return null;

      const functionScope = sourceCode.getScope(node);
      return functionScope.variables.find((v) => v.name === param.name) ?? null;
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

    function findFrameForVariable(variable: TSESLint.Scope.Variable): CallbackFrame | null {
      for (let i = callbackStack.length - 1; i >= 0; i--) {
        if (callbackStack[i].paramVariable === variable) return callbackStack[i];
      }
      return null;
    }

    function enterFunction(node: FunctionNode): void {
      if (isCreateEmptySelectionCallback(node)) {
        callbackStack.push({ node, paramVariable: getParamVariable(node) });
      }
    }

    function exitFunction(node: FunctionNode): void {
      if (isCreateEmptySelectionCallback(node)) callbackStack.pop();
    }

    function checkAssignment(
      node: TSESTree.AssignmentExpression,
      assignmentTarget: TSESTree.Node,
      rhs: TSESTree.Node
    ): void {
      if (callbackStack.length === 0) return;
      if (rhs.type !== TSESTree.AST_NODE_TYPES.Identifier) return;

      const rhsScope = sourceCode.getScope(node);
      const rhsVariable = findVariable(rhsScope, rhs.name);
      if (!rhsVariable) return;

      const frame = findFrameForVariable(rhsVariable);
      if (!frame) return;

      if (assignmentTarget.type === TSESTree.AST_NODE_TYPES.Identifier) {
        const scope = sourceCode.getScope(node);
        const variable = findVariable(scope, assignmentTarget.name);

        if (variable && variable.defs.length > 0) {
          const defNode = variable.defs[0].node;
          if (!isInsideNode(defNode, frame.node)) {
            context.report({ node, messageId: "selectionEscapesScope" });
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
          if (!isInsideNode(defNode, frame.node)) {
            context.report({ node, messageId: "selectionEscapesViaProperty" });
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
