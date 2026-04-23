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

import noActionScopeEscape from "./no-action-scope-escape";
import noActionScopeEscapeTypeChecked from "./no-action-scope-escape-type-checked";
import noAsyncInLockedAccess from "./no-async-in-locked-access";
import noAsyncInLockedAccessTypeChecked from "./no-async-in-locked-access-type-checked";
import noAsyncInExecuteTransaction from "./no-async-in-execute-transaction";
import noAsyncInExecuteTransactionTypeChecked from "./no-async-in-execute-transaction-type-checked";
import preferLockedAccessWrapper from "./prefer-locked-access-wrapper";
import preferLockedAccessWrapperTypeChecked from "./prefer-locked-access-wrapper-type-checked";
import preferUndoString from "./prefer-undo-string";
import preferUndoStringTypeChecked from "./prefer-undo-string-type-checked";
import requireExecuteTransaction from "./require-execute-transaction";
import requireExecuteTransactionTypeChecked from "./require-execute-transaction-type-checked";
import requireActionLockScope from "./require-action-lock-scope";
import requireActionLockScopeTypeChecked from "./require-action-lock-scope-type-checked";

export const syntacticRules = {
  "no-action-scope-escape": noActionScopeEscape,
  "no-async-in-locked-access": noAsyncInLockedAccess,
  "no-async-in-execute-transaction": noAsyncInExecuteTransaction,
  "prefer-locked-access-wrapper": preferLockedAccessWrapper,
  "prefer-undo-string": preferUndoString,
  "require-execute-transaction": requireExecuteTransaction,
  "require-action-lock-scope": requireActionLockScope,
};

export const typeCheckedRules = {
  "no-action-scope-escape-type-checked": noActionScopeEscapeTypeChecked,
  "no-async-in-locked-access-type-checked": noAsyncInLockedAccessTypeChecked,
  "no-async-in-execute-transaction-type-checked": noAsyncInExecuteTransactionTypeChecked,
  "prefer-locked-access-wrapper-type-checked": preferLockedAccessWrapperTypeChecked,
  "prefer-undo-string-type-checked": preferUndoStringTypeChecked,
  "require-execute-transaction-type-checked": requireExecuteTransactionTypeChecked,
  "require-action-lock-scope-type-checked": requireActionLockScopeTypeChecked,
};
