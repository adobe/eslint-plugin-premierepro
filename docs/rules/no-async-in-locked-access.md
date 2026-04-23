# no-async-in-locked-access

Disallow async operations inside `lockedAccess()` callbacks.

## Rule Details

`Project.lockedAccess()` locks the project for read use for code invoked within its callback. The lock is held only for the synchronous duration of the callback — once the callback returns, the lock is released. Any asynchronous code (e.g. `await`, `setTimeout`, `.then()`) will execute **after** the lock has been released, defeating the purpose of the lock and likely causing runtime errors.

### Correct

```js
project.lockedAccess(() => {
  const action = trackItem.createMoveAction(tickTime);
  project.executeTransaction((compoundAction) => {
    compoundAction.addAction(action);
  }, "Move clip");
});
```

### Incorrect

```js
// ✗ async callback — lock released before awaited work completes
project.lockedAccess(async () => {
  const data = await fetchData();
  const action = trackItem.createMoveAction(data.tickTime);
});

// ✗ setTimeout — callback runs after lock is released
project.lockedAccess(() => {
  setTimeout(() => {
    trackItem.createMoveAction(tickTime);
  }, 0);
});

// ✗ Promise chaining — .then() runs after lock is released
project.lockedAccess(() => {
  fetchData().then((data) => {
    trackItem.createMoveAction(data.tickTime);
  });
});
```

## Options

This rule has no options.

## Known Limitations

- **`.then()` / `.catch()` / `.finally()`** detection is name-based. If your codebase has unrelated methods with these names on non-Promise objects, those calls will also be flagged inside `lockedAccess`. In practice, this is rarely a problem — using these method names inside a synchronous lock callback is suspicious regardless.
- **Nested async functions** defined inside `lockedAccess` are flagged (their `await` expressions are detected). This is intentional — calling an `async` function inside `lockedAccess` starts asynchronous work that will outlive the lock.
