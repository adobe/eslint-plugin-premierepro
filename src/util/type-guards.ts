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

import ts from "typescript";

/**
 * Check whether a symbol was declared in the @adobe/premierepro type
 * definitions and has the expected name.
 */
function matchesPremiereProSymbol(symbol: ts.Symbol, typeName: string): boolean {
  if (symbol.getName() !== typeName) return false;

  const declarations = symbol.getDeclarations();
  if (!declarations?.length) return false;

  return declarations.some((decl) => {
    const fileName = decl.getSourceFile().fileName;
    return fileName.includes("@adobe/premierepro") || fileName.endsWith("premierepro.d.ts");
  });
}

/**
 * Check whether a TypeScript type originates from @adobe/premierepro
 * and matches the given type name. Handles union types by checking
 * each constituent.
 */
function isPremiereProType(type: ts.Type, typeName: string): boolean {
  if (type.isUnion()) {
    return type.types.some((t) => isPremiereProType(t, typeName));
  }

  if (type.aliasSymbol && matchesPremiereProSymbol(type.aliasSymbol, typeName)) {
    return true;
  }

  const symbol = type.getSymbol();
  return symbol != null && matchesPremiereProSymbol(symbol, typeName);
}

export function isActionType(type: ts.Type): boolean {
  return isPremiereProType(type, "Action");
}

export function isCompoundActionType(type: ts.Type): boolean {
  return isPremiereProType(type, "CompoundAction");
}

export function isProjectType(type: ts.Type): boolean {
  return isPremiereProType(type, "Project");
}
