# no-async-in-execute-transaction

Disallow async operations inside `executeTransaction()` callbacks.

## Rule Details

`Project.executeTransaction()` executes multiple action invocations into a single undo/redo item using a compound action to bundle them. The transaction callback is executed synchronously. Any asynchronous code (e.g. `await`, `setTimeout`, `.then()`) will execute **after** the transaction has committed. This will most likely result in runtime errors as any actions created after the transaction will be done so outside of any locking mechanisms.

### Correct

```js
project.executeTransaction((compoundAction) => {
  const action1 = trackItem.createMoveAction(tickTime);
  const action2 = trackItem2.createScaleAction(scaleX);
  compoundAction.addAction(action1);
  compoundAction.addAction(action2);
}, "Move and scale");
```

### Incorrect

```js
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

## Known Limitations

- **`.then()` / `.catch()` / `.finally()`** detection is name-based. If your codebase has unrelated methods with these names on non-Promise objects, those calls will also be flagged inside `executeTransaction`. In practice this is rarely a problem, as using these method names inside a synchronous transaction callback is suspicious regardless.
- **Nested async functions** defined inside `executeTransaction` are flagged (their `await` expressions are detected). This is intentional since calling an `async` function inside `executeTransaction` starts asynchronous work that will outlive the transaction.
