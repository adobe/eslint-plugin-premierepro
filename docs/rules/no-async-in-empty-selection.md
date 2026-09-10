# no-async-in-empty-selection

Disallow async operations inside `TrackItemSelection.createEmptySelection()` callbacks.

## Rule Details

`TrackItemSelection.createEmptySelection()` hands your callback an empty selection to populate synchronously. The selection is only valid while the callback is running. Any asynchronous code (e.g. `await`, `setTimeout`, `.then()`) will execute **after** `createEmptySelection()` has already returned, by which point the selection is stale and using it will most likely result in runtime errors.

### Correct

```js
ppro.TrackItemSelection.createEmptySelection((selection) => {
  selection.addItem(trackItem1);
  selection.addItem(trackItem2);
});
```

### Incorrect

```js
// ✗ async callback — createEmptySelection() returns before awaited work runs
ppro.TrackItemSelection.createEmptySelection(async (selection) => {
  const items = await fetchItems();
  selection.addItem(items[0]);
});

// ✗ setTimeout — callback runs after createEmptySelection() has returned
ppro.TrackItemSelection.createEmptySelection((selection) => {
  setTimeout(() => {
    selection.addItem(trackItem);
  }, 0);
});

// ✗ Promise chaining — .then() runs after createEmptySelection() has returned
ppro.TrackItemSelection.createEmptySelection((selection) => {
  fetchItems().then((items) => {
    selection.addItem(items[0]);
  });
});
```

## Options

This rule has no options.

## Known Limitations

- **`.then()` / `.catch()` / `.finally()`** detection is name-based. If your codebase has unrelated methods with these names on non-Promise objects, those calls will also be flagged inside `createEmptySelection`. In practice this is rarely a problem, as using these method names inside a synchronous callback is suspicious regardless.
- **Nested async functions** defined inside `createEmptySelection` are flagged (their `await` expressions are detected). This is intentional since calling an `async` function inside `createEmptySelection` starts asynchronous work that will outlive the callback.
