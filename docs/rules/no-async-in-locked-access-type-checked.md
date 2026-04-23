# no-async-in-locked-access-type-checked

Disallow async operations inside premierepro `Project.lockedAccess()` callbacks.

This is the **type-checked** variant of [`no-async-in-locked-access`](./no-async-in-locked-access.md). It uses the TypeScript type checker to:

1. Verify that `.lockedAccess()` is called on an actual `Project` from `@adobe/premierepro`, eliminating false positives from unrelated objects.
2. Verify that `.then()` / `.catch()` / `.finally()` are called on actual `Promise` types, eliminating false positives from non-Promise objects with those method names.

## Rule Details

`Project.lockedAccess()` locks the project for read use for code invoked within its callback. The lock is held only for the synchronous duration of the callback, and once the callback returns, the lock is released. Any asynchronous code (e.g. `await`, `setTimeout`, `.then()`) will execute **after** the lock has been released, defeating the purpose of the lock and likely causing runtime errors.

### Correct

```ts
import { Project } from "@adobe/premierepro";
declare const project: Project;

project.lockedAccess(() => {
  const action = trackItem.createMoveAction(tickTime);
  project.executeTransaction((compoundAction) => {
    compoundAction.addAction(action);
  }, "Move clip");
});

// .lockedAccess() on a non-Project object is NOT flagged
const db = {
  lockedAccess(cb: () => void) {
    cb();
  },
};
db.lockedAccess(async () => {
  await fetchData(); // Fine — not a premierepro Project
});

// .then() on a non-Promise is NOT flagged inside lockedAccess
project.lockedAccess(() => {
  handler.then(() => {
    /* sync */
  }); // Fine — handler is not a Promise
});
```

### Incorrect

```ts
import { Project } from "@adobe/premierepro";
declare const project: Project;

// async callback — lock released before awaited work completes
project.lockedAccess(async () => {
  const data = await fetchData();
  const action = trackItem.createMoveAction(data.tickTime);
});

// setTimeout — callback runs after lock is released
project.lockedAccess(() => {
  setTimeout(() => {
    trackItem.createMoveAction(tickTime);
  }, 0);
});

// Promise chaining — .then() runs after lock is released
project.lockedAccess(() => {
  fetchData().then((data) => {
    trackItem.createMoveAction(data.tickTime);
  });
});
```

## Options

This rule has no options.

## When to Use

Use this rule instead of `no-async-in-locked-access` when your project has TypeScript and type information configured in ESLint.

## Requirements

This rule requires [typed linting](https://typescript-eslint.io/getting-started/typed-linting/) to be configured.
