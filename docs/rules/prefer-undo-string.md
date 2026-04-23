# prefer-undo-string

Suggest providing an undo string when calling `executeTransaction()`.

## Rule Details

`Project.executeTransaction()` accepts an optional second argument — a human-readable string that appears in the Edit > Undo menu (e.g. "Undo Move Clip"). Omitting it results in a generic undo entry that gives users no indication of what the operation did. This rule encourages always providing a descriptive undo string for a better user experience.

### Correct

```js
project.executeTransaction((compoundAction) => {
  compoundAction.addAction(action);
}, "Move clip to new position");
```

### Incorrect

```js
// ✗ Missing undo string — Undo menu will show a generic label
project.executeTransaction((compoundAction) => {
  compoundAction.addAction(action);
});
```

## Options

This rule has no options.
