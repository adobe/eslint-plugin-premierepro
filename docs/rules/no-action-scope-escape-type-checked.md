# no-action-scope-escape-type-checked

Disallow premierepro `Action` objects from escaping the lock scope they were created in (`lockedAccess()` or `executeTransaction()`).

This is the **type-checked** variant of [`no-action-scope-escape`](./no-action-scope-escape.md). Instead of matching `create*Action()` calls by regex, it uses the TypeScript type checker to verify that the assigned value is actually an `Action` from `@adobe/premierepro`. This catches wrapper functions and eliminates false positives from unrelated APIs.

## Rule Details

When a call expression inside a lock callback (`lockedAccess()` or `executeTransaction()`) returns an `Action` from `@adobe/premierepro`, assigning its result to a variable or property declared outside that callback is flagged. This includes both direct API calls and wrapper functions that return `Action`.

### Correct

Action created and consumed in the same `lockedAccess` scope:

```ts
import { Project } from "@adobe/premierepro";
declare const project: Project;

project.lockedAccess(() => {
  const action = trackItem.createMoveAction(tickTime);
  project.executeTransaction((compoundAction) => {
    compoundAction.addAction(action);
  }, "Move clip");
});
```

Action created and consumed in the same `executeTransaction` scope:

```ts
project.executeTransaction((compoundAction) => {
  const action = trackItem.createMoveAction(tickTime);
  compoundAction.addAction(action);
}, "Move clip");
```

### Incorrect

Action escapes to an outer variable:

```ts
import { Project, Action } from "@adobe/premierepro";
declare const project: Project;

let action: Action | undefined;
project.lockedAccess(() => {
  action = trackItem.createMoveAction(tickTime);
});

// Later — action is stale
project.lockedAccess(() => {
  project.executeTransaction((ca) => {
    ca.addAction(action); // Runtime error
  }, "Move clip");
});
```

Wrapper function returning Action escapes lock scope:

```ts
function buildEdit(): Action {
  return trackItem.createMoveAction(tickTime);
}

let edit: Action | undefined;
project.lockedAccess(() => {
  edit = buildEdit();
});
```

Action created in one lock scope, used in another:

```ts
let moveAction: Action | undefined;
project.executeTransaction((compoundAction) => {
  moveAction = trackItem.createMoveAction(tickTime);
}, "Move");

// Later — this action is stale
project.lockedAccess(() => {
  project.executeTransaction((ca) => {
    ca.addAction(moveAction); // Runtime error
  }, "Another edit");
});
```

## Options

This rule has no options.

## Conservative Checking Strategy

This rule uses **conservative scope analysis** and will flag any action value assigned to a variable or property declared outside the lock scope, even if the value is only used within locks in practice.

This intentionally aggressive approach prevents accidental misuse—the variable declaration itself creates an escape route, and even if your current code uses it safely, future maintainers might not.

### Example: False Positive Scenario

The `buildEdit()` example in the "Incorrect" section above may look safe on first glance:

```ts
let edit: Action | undefined;
project.lockedAccess(() => {
  edit = buildEdit();  // ← Flagged: variable declared outside lock scope
  project.executeTransaction((ca) => {
    ca.addAction(edit);  // ← Used safely here
  });
});
```

This is flagged because `edit` is declared outside the lock—even though in this isolated code, it's never used outside a lock. However, the variable declaration creates a footgun for future changes.

**If you're confident a pattern is safe**, you can:
- Disable the rule inline: `// eslint-disable-next-line @adobe/premierepro/no-action-scope-escape-type-checked`
- Disable it for a file or project if your usage pattern differs
- Consider restructuring to declare the variable inside the lock scope when possible

## When to Use

Use this rule instead of `no-action-scope-escape` when your project has TypeScript and type information configured in ESLint.

## Requirements

This rule requires [typed linting](https://typescript-eslint.io/getting-started/typed-linting/) to be configured.
