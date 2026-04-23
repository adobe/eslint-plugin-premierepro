# no-async-in-execute-transaction-type-checked

Disallow async operations inside `Project.executeTransaction()` callbacks.

This is the **type-checked** variant of [`no-async-in-execute-transaction`](./no-async-in-execute-transaction.md). It uses TypeScript type information to verify that the receiver of `.executeTransaction()` is actually a `Project` from `@adobe/premierepro`, eliminating false positives from unrelated objects that happen to have an `executeTransaction` method.

## Rule Details

`Project.executeTransaction()` executes multiple action invocations into a single undo/redo item using a compound action to bundle them. The transaction callback is executed synchronously. Any asynchronous code (e.g. `await`, `setTimeout`, `.then()`) will execute **after** the transaction has committed. This will most likely result in runtime errors as any actions created after the transaction will be done so outside of any locking mechanisms.

This rule uses the TypeScript type checker to confirm the receiver is a `Project` before flagging violations, providing more accurate detection.

### Correct

```ts
import { Project } from "@adobe/premierepro";
declare const project: Project;

project.executeTransaction((compoundAction) => {
  const action1 = trackItem.createMoveAction(tickTime);
  const action2 = trackItem2.createScaleAction(scaleX);
  compoundAction.addAction(action1);
  compoundAction.addAction(action2);
}, "Move and scale");

// .executeTransaction() on a non-premierepro object -- not flagged
const db = {
  executeTransaction(cb: (tx: any) => void, msg: string) {
    cb({});
  },
};
db.executeTransaction(async (tx) => {
  await doWork();
}, "Work");
```

### Incorrect

```ts
import { Project } from "@adobe/premierepro";
declare const project: Project;

// ✗ async callback — transaction completes before awaited work runs
project.executeTransaction(async (compoundAction) => {
  const data = await fetchActionData();
  const action = trackItem.createMoveAction(data.tickTime);
  compoundAction.addAction(action);
}, "Move clip");

// ✗ setTimeout — callback runs after transaction is committed
project.executeTransaction((compoundAction) => {
  setTimeout(() => {
    const action = trackItem.createMoveAction(tickTime);
    compoundAction.addAction(action);
  }, 0);
}, "Move clip");

// ✗ Promise chaining — .then() runs after transaction is committed
project.executeTransaction((compoundAction) => {
  fetchActionData().then((data) => {
    const action = trackItem.createMoveAction(data.tickTime);
    compoundAction.addAction(action);
  });
}, "Move clip");
```

## Options

This rule has no options.

## When to Use

Use this rule instead of `no-async-in-execute-transaction` when your project has TypeScript and type information configured in ESLint. It provides the same protection with fewer false positives.

## Requirements

This rule requires [typed linting](https://typescript-eslint.io/getting-started/typed-linting/) to be configured.
