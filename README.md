# @softwarity/store

[![CI](https://github.com/softwarity/store/actions/workflows/main.yml/badge.svg)](https://github.com/softwarity/store/actions/workflows/main.yml)
[![Publish to NPM](https://github.com/softwarity/store/actions/workflows/tag.yml/badge.svg)](https://github.com/softwarity/store/actions/workflows/tag.yml)
[![npm version](https://badge.fury.io/js/@softwarity%2Fstore.svg)](https://badge.fury.io/js/@softwarity%2Fstore)

`@softwarity/store` lets you persist UI preferences (visible columns, sort order, page size, filters, sidebar state…) directly in the browser — no server-side persistence needed. No API endpoints, no database tables, no extra round-trips: everything stays client-side, where UI preferences belong.

A single decorator or function call is all it takes. Annotate a property — or wrap an object with `localStored()` / `sessionStored()` — and every mutation (including nested properties and array methods) is automatically persisted to browser storage and restored on reload. No manual `getItem` / `setItem`, no boilerplate serialization logic — `@softwarity/store` handles it all for you.

**[Live demo](https://softwarity.github.io/store/)**

## Features

- **Decorator API** — `@LocalStored` / `@SessionStored` with deep mutation tracking and `$prop()` reactive signals
- **Stored API** — `localStored()` / `sessionStored()` — same deep tracking and `$prop()` signals, without annotations
- **Deep mutation tracking** — Native `Proxy`-based: nested properties, array methods, direct index assignment (`arr[0] = 'x'`), and new properties all trigger saves automatically
- **Versioning** — Increment the version to discard stale data when the structure or defaults change
- **User-scoped storage** — Prefix storage keys with a user ID
- **Cross-tab sync** — `onStorageChange()` for localStorage changes from other tabs
- **SSR compatible** — `FakeStorage` fallback when `window` is undefined
- **~~Zoneless~~** — No dependency on zone.js

## Installation

```bash
npm install @softwarity/store
```

## Setup

### Standalone (recommended)

```typescript
import { provideStore } from '@softwarity/store';

export const appConfig = {
  providers: [provideStore()]
};
```

### Module-based (legacy)

```typescript
import { StoreModule } from '@softwarity/store';

@NgModule({ imports: [StoreModule] })
export class AppModule {}
```

## Decorator API

Annotate class fields for automatic persistence. Nested property changes, array methods, and direct index assignments trigger saves automatically.

```typescript
import { LocalStored, SessionStored } from '@softwarity/store';

@Component({ ... })
export class MyComponent {

  // localStorage — version 1
  // Increment to discard stale data when the structure or defaults change.
  @LocalStored(1)
  tableConfig = {
    columns: ['name', 'age'],
    sort: { active: 'name', direction: 'asc' },
    pageSize: 25
  };

  // sessionStorage (no version needed, data is short-lived)
  @SessionStored()
  filters = { search: '', category: 'all' };

  // Custom storage key (instead of auto-generated ClassName.property)
  @LocalStored(1, 'shared-config')
  sharedConfig = { theme: 'dark' };

  // Note: decorators auto-generate the key as ClassName.property.
  // Use the optional storageKey parameter to override it.
}
```

## Stored API — `localStored` / `sessionStored`

Same deep mutation tracking as decorators, but without annotations. Returns a `StoredSignal<T>` with plain property access and `$prop()` reactive signals. Requires Angular injection context.

```typescript
import { localStored, sessionStored } from '@softwarity/store';

@Component({ ... })
export class MyComponent {

  // localStorage + deep tracking + versioning
  // storageKey is required: functions don't have access to ClassName.property,
  // unlike decorators which auto-generate it.
  config = localStored(
    { columns: ['name', 'age'], sort: { active: 'name', direction: 'asc' } },
    { storageKey: 'table-config', version: 1 }
  );

  // sessionStorage + deep tracking
  wizard = sessionStored(
    { step: 1, draft: '' },
    { storageKey: 'wizard-state' }
  );
}
```

## Deep mutation tracking

All stored objects are wrapped with native `Proxy`. All mutations trigger automatic saves:

```typescript
// All of these trigger a save:
this.config.sort.direction = 'desc';         // nested property
this.config.columns.push('email');            // array push
this.config.columns.splice(0, 1);            // array splice
this.config.columns.reverse();               // array reverse
this.config.columns.sort();                  // array sort
this.config.columns[0] = 'email';            // direct index assignment
this.config.sort.newProp = 'value';          // new property on object

// This does NOT trigger a save:
this.config = { ... };                        // root reassignment (use property setters)
```

## `$prop()` reactive signals

Both APIs expose `$`-prefixed signals at **every level of depth**, ideal for template bindings:

```html
<!-- Top-level signals -->
<mat-header-row *matHeaderRowDef="config.$columns()"></mat-header-row>
<mat-paginator
  [pageSize]="config.$pageSize()"
  [pageIndex]="config.$pageIndex()"
  (page)="onPage($event)">
</mat-paginator>

<!-- Nested object signals -->
<mat-table matSort
  [matSortActive]="config.sort.$column()"
  [matSortDirection]="config.sort.$direction()"
  (matSortChange)="onSort($event)">
</mat-table>
```

Nested signals are available at any depth (`config.a.b.$c()`). Each signal returns the plain value of the property (via `toPlain`), and updates reactively whenever the property or any of its descendants is mutated.

## Version management

Increment the version whenever the object structure or the default values change. Old stored data is discarded and replaced with the new defaults.

```typescript
// Version 1: initial structure
@LocalStored(1)
config = { columns: ['name', 'age'], sort: 'asc' };

// Version 2: added filter — stale browser data is discarded
@LocalStored(2)
config = { columns: ['name', 'age'], sort: 'asc', filter: null };

// Version 3: default columns changed — users get the new defaults
@LocalStored(3)
config = { columns: ['name', 'age', 'email'], sort: 'asc', filter: null };
```

Only `@LocalStored` and `localStored()` support versioning. `@SessionStored` and `sessionStored()` do not need it (data is short-lived).

## User-scoped storage

Browser storage (`localStorage` / `sessionStorage`) is shared across all users on the same browser profile. On shared workstations or kiosk machines, multiple people may log in to the same app one after another. Without scoping, user A's persisted preferences (columns, filters, sort order…) would leak to user B.

By providing a `userId` signal, every storage key is automatically prefixed with the current user's identifier (`userId_storageKey`). When the user changes (login / logout / switch), the library reloads each stored object from the new user's namespace — so preferences follow the user, not the machine.

### Standalone

```typescript
import { provideStore } from '@softwarity/store';
import { inject } from '@angular/core';

export const appConfig = {
  providers: [
    provideStore({ userId: () => inject(AuthService).userId })
  ]
};
```

### Module-based (legacy)

```typescript
import { StoreModule, USER_ID } from '@softwarity/store';
import { inject } from '@angular/core';

@NgModule({
  imports: [StoreModule],
  providers: [
    { provide: USER_ID, useFactory: () => inject(AuthService).userId }
  ]
})
export class AppModule {}
```

## Storage key format

| API | Without userId | With userId |
|---|---|---|
| Decorators (auto) | `ClassName.property` | `userId_ClassName.property` |
| Decorators (custom storageKey) | `storageKey` | `userId_storageKey` |
| `localStored` / `sessionStored` | `storageKey` | `userId_storageKey` |

## Cross-tab sync

Listen for localStorage changes from other browser tabs:

```typescript
import { onStorageChange } from '@softwarity/store';

@Component({ ... })
export class MyComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    onStorageChange<{ theme: string }>('app-config', newValue => {
      console.log('Changed in another tab:', newValue);
    }, this.destroyRef); // auto-cleanup on destroy
  }
}
```

> **Note:** Only works with localStorage (`StorageEvent` spec limitation).

## Utilities

```typescript
import { clearLocalStorage, clearSessionStorage } from '@softwarity/store';

// Clear all
clearLocalStorage();

// Clear only keys with a specific prefix (e.g. user-scoped data)
clearLocalStorage('alice_');
clearSessionStorage('alice_');
```

## SSR support

The library provides a `FakeStorage` class used automatically when `window` is undefined (SSR context). You can also import it directly:

```typescript
import { FakeStorage } from '@softwarity/store';
```

## License

MIT
