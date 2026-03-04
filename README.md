# Store

[![Build softwarity/store](https://github.com/softwarity/store/actions/workflows/main.yml/badge.svg)](https://github.com/softwarity/store/actions/workflows/main.yml)

[![Publish softwarity/store to NPM](https://github.com/softwarity/store/actions/workflows/tag.yml/badge.svg)](https://github.com/softwarity/store/actions/workflows/tag.yml)

[![npm version](https://badge.fury.io/js/@softwarity%2Fstore.svg)](https://badge.fury.io/js/@softwarity%2Fstore)

## Store your component configurations effortlessly

This library contains an angular module `StoreModule` that allows you to store values in the browser's `store`.
This mainly allows a configuration to be associated with a `component`, with the component becoming statefull on the attributes considered.
The configuration becomes persistent in different routes, or even a complete reloading of the page.


## Persistence of configuration

 - To navigation, change of routes, change of module.
 - When reloading the page.
 - When the browser closes/opens.

## APIs

The library provides two complementary APIs:

- **Decorator API** (`@LocalStored`, `@SessionStored`) — Annotate class fields for automatic persistence with deep mutation tracking.
- **Signals API** (`localSignal`, `sessionSignal`) — Create `WritableSignal<T>` with automatic persistence. Use immutable updates (`set()`/`update()`) or `mutateSignal()`.

## Installation

For help getting started with a new Angular app, check out the [Angular CLI](https://cli.angular.io/).

For existing apps, follow these steps to begin using `@softwarity/store` in your Angular app.

## Install @softwarity/store

You can use either the npm or yarn command-line tool to install the `package`.
Use whichever is appropriate for your project in the examples below.

### NPM

```bash
# @softwarity/store
npm install @softwarity/store --save
```

### YARN

```bash
# @softwarity/store
yarn add @softwarity/store
```

### Peer dependence

No dependency

## Configuration

### Standalone setup (recommended)

Use `provideStore()` in your application config:

```typescript
import {provideStore} from '@softwarity/store';
import {BehaviorSubject} from 'rxjs';

const userId$ = new BehaviorSubject<string>('');

export const appConfig = {
  providers: [
    provideStore(userId$)
  ]
};
```

### Module setup (legacy)

Import the module `StoreModule` in your `AppModule` or `SharedModule`:

```typescript
import {NgModule} from '@angular/core';
import {StoreModule} from '@softwarity/store';

@NgModule({
  imports: [StoreModule]
})
export class AppModule {}
```

# Use

## Decorator API

The use of 'Decorator': `LocalStored` and `SessionStored` is very simple.

### Use cases
In the following example, we'll set up a configuration object for a table,
which we would like, the columns displayed and the sorting of columns are backed up in the browser.
Whether the user changes route (`angular` mechanism), reloads the page or even returns to the page after closing the browser.
In all these cases the user will find the table as he had left it. This beyond the session.

---

In a component just annotate a class attribute as follows:

```typescript
import {Component} from '@angular/core';
import {Sort} from '@angular/material/sort';
import {LocalStored} from '@softwarity/store';

@Component({
  selector: 'app-test-decorator',
  templateUrl: './test-decorator.html',
  styleUrls: ['./test-decorator.css'],
})
export class TestDecoratorComponent {

  // ================= ANNOTATED ATTRIBUTE =================
  @LocalStored(1)
  config = {
    displayedColumns: ['col1', 'col2'],
    sort: {active: null, direction: 'asc'}
  };

  columns: ['col1', 'col2', 'col3', 'col4'];

  displayColumn(colName: string) {
    const idx = this.config.displayedColumns.indexOf(colName);
    if (idx !== -1) {
      this.config.displayedColumns.push(colName);
    }
  }
  hideColumn(colName: string) {
    const idx = this.config.displayedColumns.indexOf(colName);
    if (idx !== -1) {
      this.config.displayedColumns.splice(idx, 1);
    }
  }
  sortData(sort: Sort) {
    this.config.sort.active = sort.active;
    this.config.sort.direction = sort.direction;
  }
...
}
```

### LocalStored or SessionStored

The difference between the two `decorator` :

 - **LocalStored** : The object is stored in the browser beyond the session.
 - **SessionStored** : The object is stored only for the time of the session. The time of the session depends on the setting of the server.

The annotation `LocalStore` takes two parameters, a version number and an optional identifier. See below.

```typescript
@LocalStored(1)
config = {foo: 'bar'}

@LocalStored(1, 'ID')
config2 = {foo: 'bar'}
```

The annotation `SessionStore`, take zero or one argument, the identifier that is optional. See below.

```typescript
@SessionStored('ID')
config = {foo: 'bar'}
```

### Version management (LocalStored)

#### Repudiation

As you will have understood as soon as the object is changed, it will be stored in the browser.

Access to the attribute will serve the object stored in the browser.

But how do you make browser content obsolete, for example, add new values to the saved configuration.

In our example, we want to add now a persistent filter.

Problem is always the content of the browser that will now be used when accessing the object defined by the attribute `config`.
Even if you change the code, will still be the object from browser that will be served.
Unless you ask all users to empty the browser store...

To do this the `decorator` `LocalStored` has a version mechanism.
Changing, incremating more accurately, the version number of the configuration presented in the sources,
will make the configuration stored in the browser obsolete.

Only `LocalStored` has this mechanism. `SessionStored` only persists for the time of the session, this is not relevant to him.

```typescript
@LocalStored(2) // Incremented version number
config = {
  displayedColumns: ['col1', 'col2'],
  sort: {active: null, direction: 'asc'},
  filter: null
};
```

### Id management

If in the previous example the table configuration is linked to the 'TestDecoratorComponent' component, we sometimes want to be able to share a configuration between several components.

**!!Attention!!** this mechanism is not adapted to make components communicate with each other.

To do this we can specify an `id` on the decorator in addition to the `version`.

```typescript
@LocalStored(2, 'CONFIG_TABLE') // ID used as a key in the store
config = {...};
```

### What works and what doesn't

```typescript
@LocalStored(2, 'CONFIG_TABLE')
config = {data: 5, child: {subData: {value: 7}}, arr: ['', 5, {value: 0}, [6]]};

updateStore() {
  // !! doesn't work for direct attribute, use accessor
  this.config = {data: 6}; // no ok
  // =================================
  this.config.data = 6; // ok
  this.config.child.subData.value = 8; // ok
  this.config.child.subData = {value: 6, test: 8}; // ok
  this.config.arr[2].value = 'a'; // ok
  // !! doesn't work, use splice
  this.config.arr[0] = 'a'; // no ok
  this.config.arr[3][0] = 9; // no ok
  // =================================
  this.config.arr.splice(0, 1, 'a'); // ok
  this.config.arr[3].splice(0, 1, 9);  // ok
  this.config.arr.push('a'); // ok
  this.config.arr.pop(); // ok
  this.config.arr.shift(); // ok
  this.config.arr.unshift('b'); // ok
  this.config.arr.fill(0, 2); // ok
  this.config.arr.sort(); // ok
  this.config.arr.copyWithin(0, 2); // ok
  this.config.arr.reverse(); // ok
}
```
This basically everything works except the modification of the object directly to the root and the change of the contents of a 'array' by its 'index'

## Signals API

The Signals API provides a modern, reactive alternative to decorators. Signals must be called within an Angular injection context (or with an explicit `injector`).

### localSignal

```typescript
import {localSignal, mutateSignal} from '@softwarity/store';

@Component({...})
export class MyComponent {
  // Persisted to localStorage with version-based invalidation
  config = localSignal({columns: ['a', 'b'], sort: 'asc'}, 1, {id: 'my-config'});

  toggleSort() {
    this.config.update(c => ({...c, sort: c.sort === 'asc' ? 'desc' : 'asc'}));
  }

  addColumn(name: string) {
    mutateSignal(this.config, draft => {
      draft.columns = [...draft.columns, name];
    });
  }
}
```

### sessionSignal

```typescript
import {sessionSignal} from '@softwarity/store';

@Component({...})
export class MyComponent {
  // Persisted to sessionStorage (no versioning)
  tempState = sessionSignal({step: 1}, {id: 'wizard-state'});
}
```

### With explicit injector

```typescript
import {Injector} from '@angular/core';
import {localSignal} from '@softwarity/store';

@Component({...})
export class MyComponent {
  private injector = inject(Injector);

  ngOnInit() {
    const sig = localSignal({foo: 'bar'}, 1, {id: 'test', injector: this.injector});
  }
}
```

## Cross-tab sync

Listen for localStorage changes from other browser tabs:

```typescript
import {onStorageChange} from '@softwarity/store';

@Component({...})
export class MyComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    onStorageChange<{theme: string}>('my-config', newValue => {
      console.log('Config changed in another tab:', newValue);
    }, this.destroyRef);
  }
}
```

## Utilities

```typescript
import {clearLocalStorage, clearSessionStorage} from '@softwarity/store';

// Clear all
clearLocalStorage();

// Clear only keys with a specific prefix (e.g. user-scoped data)
clearLocalStorage('alice_');
clearSessionStorage('alice_');
```

## SSR Support

The library provides a `FakeStorage` class that is used automatically when `window` is undefined (SSR context). You can also import it directly:

```typescript
import {FakeStorage} from '@softwarity/store';
```
