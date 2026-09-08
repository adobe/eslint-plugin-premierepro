# no-empty-selection-escape

Disallow the `TrackItemSelection.createEmptySelection()` callback parameter from escaping the callback.

## Rule Details

`TrackItemSelection.createEmptySelection()` creates an empty selection and hands it to your callback so you can populate it. The selection object is only valid for the duration of that callback — pulling it out (assigning it to an outer variable or object) and using it later leads to runtime errors, since the selection is no longer backed by a live session.

This is easy to get wrong because the API shape looks like it returns a value, but it's actually delivered through a callback:

```js
// Looks like it should return something, but doesn't
const selection = ppro.TrackItemSelection.createEmptySelection((s) => {
  s.addItem(trackItem);
});
// selection here is the boolean return value of createEmptySelection(), not the selection!
```

The rule detects when the callback's selection parameter is assigned to a variable or property that was declared **outside** the callback, which is the primary mechanism by which the selection escapes its scope.

### Correct

Selection populated and used entirely within the callback:

```js
ppro.TrackItemSelection.createEmptySelection((selection) => {
  selection.addItem(trackItem);
});
```

### Incorrect

Selection escapes to an outer variable:

```js
// ✗ Declared outside the callback
let selection;
ppro.TrackItemSelection.createEmptySelection((s) => {
  selection = s;
});

// Sometime later — selection is stale
selection.addItem(trackItem); // Runtime error
```

Selection stored on an external object:

```js
// ✗ Stored on external object
const state = {};
ppro.TrackItemSelection.createEmptySelection((selection) => {
  state.selection = selection;
});
```

## Options

This rule has no options.

## Conservative Checking Strategy

This rule uses **conservative scope analysis** and will flag the selection parameter being assigned to a variable or property declared outside the callback, even if the value is only used within the callback in practice.

This intentionally aggressive approach prevents accidental misuse—the variable declaration itself creates an escape route, and even if your current code uses it safely, future maintainers might not.

**If you're confident a pattern is safe**, you can:

- Disable the rule inline: `// eslint-disable-next-line @adobe/premierepro/no-empty-selection-escape`
- Disable it for a file or project if your usage pattern differs
- Consider restructuring to declare the variable inside the callback when possible

## Known Limitations

The rule uses **static scope analysis** — it checks whether the assignment target was declared inside or outside the callback. This means:

- **Simple assignments** (`x = selection`) and **property assignments** (`obj.prop = selection`) are detected.
- **Indirect escapes**--such as passing the selection through function calls, `Array.push()`, `Map.set()`, or returning it from the callback--are not currently detected. These patterns are less common but could be added in future versions.
