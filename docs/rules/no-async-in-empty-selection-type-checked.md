# no-async-in-empty-selection-type-checked

Disallow async operations inside premierepro `TrackItemSelection.createEmptySelection()` callbacks.

This is the type-checked counterpart of [`no-async-in-empty-selection`](./no-async-in-empty-selection.md). It uses TypeScript's type checker to confirm that `createEmptySelection()` is actually the premierepro `TrackItemSelection` static method and that `.then()`/`.catch()`/`.finally()` calls are on real `Promise` values, eliminating false positives.

## Rule Details

`TrackItemSelection.createEmptySelection()` hands your callback an empty selection to populate synchronously. The selection is only valid while the callback is running. Any asynchronous code (e.g. `await`, `setTimeout`, `.then()`) will execute **after** `createEmptySelection()` has already returned, by which point the selection is stale and using it will most likely result in runtime errors.

### Correct

```ts
import type { premierepro } from "@adobe/premierepro";
declare const ppro: premierepro;

ppro.TrackItemSelection.createEmptySelection((selection) => {
  selection.addItem(trackItem1);
  selection.addItem(trackItem2);
});
```

### Incorrect

```ts
import type { premierepro } from "@adobe/premierepro";
declare const ppro: premierepro;

// ✗ async callback — createEmptySelection() returns before awaited work runs
ppro.TrackItemSelection.createEmptySelection(async (selection) => {
  const items = await fetchItems();
  selection.addItem(items[0]);
});

// ✗ Promise chaining — .then() runs after createEmptySelection() has returned
ppro.TrackItemSelection.createEmptySelection((selection) => {
  fetchItems().then((items) => {
    selection.addItem(items[0]);
  });
});
```

A same-named `.createEmptySelection()` on an unrelated object is **not** flagged:

```ts
const other = {
  createEmptySelection(cb: (selection: unknown) => void) {
    cb({});
  },
};
other.createEmptySelection(async (selection) => {
  await Promise.resolve(); // Not flagged — `other` isn't the premierepro TrackItemSelection
});
```

## Options

This rule has no options.

## Known Limitations

- **Nested async functions** defined inside `createEmptySelection` are flagged (their `await` expressions are detected). This is intentional since calling an `async` function inside `createEmptySelection` starts asynchronous work that will outlive the callback.
