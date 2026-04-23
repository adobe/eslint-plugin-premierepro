# require-execute-transaction-type-checked

Require `CompoundAction.addAction()` calls to be within a `Project.executeTransaction()` callback.

This is the **type-checked** variant of [`require-execute-transaction`](./require-execute-transaction.md). It uses TypeScript type information to verify that the receiver of `.addAction()` is actually a `CompoundAction` from `@adobe/premierepro`, eliminating false positives from unrelated objects that happen to have an `addAction` method.

## Rule Details

`CompoundAction.addAction()` is only valid inside the callback passed to `Project.executeTransaction()`. This rule uses the TypeScript type checker to confirm the object is a `CompoundAction` before flagging the call.

### Correct

```ts
import { Project } from "@adobe/premierepro";
declare const project: Project;

// addAction on CompoundAction inside executeTransaction
project.lockedAccess(() => {
  project.executeTransaction((compoundAction) => {
    const action = trackItem.createMoveAction(tickTime);
    compoundAction.addAction(action);
  }, "Move clip");
});

// addAction on a non-premierepro object -- not flagged
const queue = { addAction: (item: unknown) => {} };
queue.addAction(someItem);
```

### Incorrect

```ts
import { Project, CompoundAction } from "@adobe/premierepro";
declare const project: Project;
declare const ca: CompoundAction;

// addAction on CompoundAction outside executeTransaction
ca.addAction(action);

// addAction on CompoundAction inside lockedAccess but not executeTransaction
project.lockedAccess(() => {
  ca.addAction(action);
});
```

## Options

This rule has no options.

## When to Use

Use this rule instead of `require-execute-transaction` when your project has TypeScript and type information configured in ESLint. It provides the same protection with fewer false positives.

## Requirements

This rule requires [typed linting](https://typescript-eslint.io/getting-started/typed-linting/) to be configured.
