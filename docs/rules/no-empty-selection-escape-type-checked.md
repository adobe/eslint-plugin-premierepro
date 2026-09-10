# no-empty-selection-escape-type-checked

Disallow the premierepro `TrackItemSelection.createEmptySelection()` callback parameter from escaping the callback.

This is the type-checked counterpart of [`no-empty-selection-escape`](./no-empty-selection-escape.md). It uses TypeScript's type checker to confirm that `createEmptySelection()` is actually the premierepro `TrackItemSelection` static method, eliminating false positives on unrelated methods that happen to share the name.

## Rule Details

`TrackItemSelection.createEmptySelection()` creates an empty selection and hands it to your callback so you can populate it. The selection object is only valid for the duration of that callback — pulling it out (assigning it to an outer variable or object) and using it later leads to runtime errors, since the selection is no longer backed by a live session.

The rule detects when the callback's selection parameter is assigned to a variable or property that was declared **outside** the callback, which is the primary mechanism by which the selection escapes its scope.

### Correct

Selection populated and used entirely within the callback:

```ts
import type { premierepro } from "@adobe/premierepro";
declare const ppro: premierepro;

ppro.TrackItemSelection.createEmptySelection((selection) => {
  selection.addItem(trackItem);
});
```

### Incorrect

Selection escapes to an outer variable:

```ts
import type { premierepro, TrackItemSelection } from "@adobe/premierepro";
declare const ppro: premierepro;

// ✗ Declared outside the callback
let selection: TrackItemSelection | undefined;
ppro.TrackItemSelection.createEmptySelection((s) => {
  selection = s;
});

// Sometime later — selection is stale
selection.addItem(trackItem); // Runtime error
```

Selection stored on an external object:

```ts
import type { premierepro, TrackItemSelection } from "@adobe/premierepro";
declare const ppro: premierepro;

// ✗ Stored on external object
const state: { selection?: TrackItemSelection } = {};
ppro.TrackItemSelection.createEmptySelection((selection) => {
  state.selection = selection;
});
```

A same-named method on an unrelated object is **not** flagged, since the type checker confirms it isn't the premierepro `TrackItemSelection.createEmptySelection()`:

```ts
const other = {
  createEmptySelection(cb: (selection: { addItem(x: unknown): void }) => void) {
    cb({ addItem: () => {} });
  },
};
let saved: unknown;
other.createEmptySelection((selection) => {
  saved = selection; // Not flagged — `other` isn't the premierepro TrackItemSelection
});
```

## Options

This rule has no options.

## Known Limitations

The rule uses **static scope analysis** — it checks whether the assignment target was declared inside or outside the callback. This means:

- **Simple assignments** (`x = selection`) and **property assignments** (`obj.prop = selection`) are detected.
- **Indirect escapes**--such as passing the selection through function calls, `Array.push()`, `Map.set()`, or returning it from the callback--are not currently detected. These patterns are less common but could be added in future versions.
