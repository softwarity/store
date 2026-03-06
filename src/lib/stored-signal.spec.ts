import {Injector, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {StoreService} from './store.service';
import {localStored, sessionStored} from './stored-signal';

describe('localStored', () => {
  let injector: Injector;

  beforeEach(() => {
    localStorage.clear();
    StoreService.userId.set(null);
    TestBed.configureTestingModule({});
    injector = TestBed.inject(Injector);
  });

  afterEach(() => localStorage.clear());

  it('should create with initial values accessible as plain properties', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5, sort: 'asc'}, {storageKey: 'ld-test', version: 1})
    );
    expect(config.pageSize).toBe(5);
    expect(config.sort).toBe('asc');
  });

  it('should expose $-prefixed signals for each property', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {storageKey: 'ld-test', version: 1})
    );
    expect(config.$pageSize()).toBe(5);
  });

  it('should persist on plain property assignment', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {storageKey: 'ld-test', version: 1})
    );
    config.pageSize = 10;
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.pageSize).toBe(10);
    expect(stored._schemaVersion).toBe(1);
  });

  it('should update $-prefixed signal on property assignment', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {storageKey: 'ld-test', version: 1})
    );
    config.pageSize = 42;
    expect(config.$pageSize()).toBe(42);
  });

  it('should track nested object mutations', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {storageKey: 'ld-test', version: 1})
    );
    config.sort.direction = 'desc';
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.sort.direction).toBe('desc');
    expect(stored.sort.column).toBe('name');
  });

  it('should update $-prefixed signal on nested mutation', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {storageKey: 'ld-test', version: 1})
    );
    config.sort.direction = 'desc';
    expect(config.$sort()).toEqual({column: 'name', direction: 'desc'});
  });

  it('should track array push', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['name', 'age']}, {storageKey: 'ld-test', version: 1})
    );
    config.columns.push('email');
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['name', 'age', 'email']);
  });

  it('should track array splice', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['name', 'age', 'email']}, {storageKey: 'ld-test', version: 1})
    );
    config.columns.splice(1, 1);
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['name', 'email']);
  });

  it('should track array reverse', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['a', 'b', 'c']}, {storageKey: 'ld-test', version: 1})
    );
    config.columns.reverse();
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['c', 'b', 'a']);
  });

  it('should load from storage on creation', () => {
    localStorage.setItem('ld-test', JSON.stringify({_schemaVersion: 1, pageSize: 42}));
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {storageKey: 'ld-test', version: 1})
    );
    expect(config.pageSize).toBe(42);
  });

  it('should use initial value on version mismatch', () => {
    localStorage.setItem('ld-test', JSON.stringify({_schemaVersion: 1, pageSize: 42}));
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {storageKey: 'ld-test', version: 2})
    );
    expect(config.pageSize).toBe(5);
  });

  it('should handle corrupted JSON in storage', () => {
    localStorage.setItem('ld-test', 'NOT_VALID');
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {storageKey: 'ld-test', version: 1})
    );
    expect(config.pageSize).toBe(5);
    expect(localStorage.getItem('ld-test')).toBeNull();
  });

  it('should work with explicit injector option', () => {
    const config = localStored({pageSize: 5}, {storageKey: 'ld-test', version: 1, injector});
    expect(config.pageSize).toBe(5);
  });

  it('should react to userId changes', () => {
    StoreService.userId.set('alice');
    localStorage.setItem('alice_ld-test', JSON.stringify({_schemaVersion: 1, pageSize: 99}));

    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {storageKey: 'ld-test', version: 1})
    );
    expect(config.pageSize).toBe(99);

    localStorage.setItem('bob_ld-test', JSON.stringify({_schemaVersion: 1, pageSize: 77}));
    StoreService.userId.set('bob');
    TestBed.flushEffects();
    expect(config.pageSize).toBe(77);
    expect(config.$pageSize()).toBe(77);
  });

  it('should track deep mutations on pushed objects', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({items: [{name: 'a'}]}, {storageKey: 'ld-test', version: 1})
    );
    config.items.push({name: 'b'});
    config.items[1].name = 'c';
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.items[1].name).toBe('c');
  });

  it('should persist multiple properties independently', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({count: 0, name: 'test'}, {storageKey: 'ld-test', version: 1})
    );
    config.count = 42;
    expect(config.count).toBe(42);
    expect(config.name).toBe('test');
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.count).toBe(42);
    expect(stored.name).toBe('test');
  });

  it('should track direct array index assignment', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['name', 'age', 'email']}, {storageKey: 'ld-test', version: 1})
    );
    config.columns[0] = 'id';
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['id', 'age', 'email']);
    expect(config.$columns()).toEqual(['id', 'age', 'email']);
  });

  it('should track direct array index assignment with object', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({items: [{name: 'a'}, {name: 'b'}]}, {storageKey: 'ld-test', version: 1})
    );
    config.items[0] = {name: 'z'};
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.items[0].name).toBe('z');
    // The replaced object should also be deep-tracked
    config.items[0].name = 'w';
    const stored2 = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored2.items[0].name).toBe('w');
  });

  it('should track new property on nested object', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {storageKey: 'ld-test', version: 1})
    );
    (config.sort as any).newProp = 'value';
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.sort.newProp).toBe('value');
  });

  it('should track array length = 0', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['name', 'age', 'email']}, {storageKey: 'ld-test', version: 1})
    );
    config.columns.length = 0;
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual([]);
    expect(config.$columns()).toEqual([]);
  });

  it('should not double-wrap already tracked values', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['c', 'a', 'b']}, {storageKey: 'ld-test', version: 1})
    );
    config.columns.sort();
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['a', 'b', 'c']);
    config.columns.reverse();
    const stored2 = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored2.columns).toEqual(['c', 'b', 'a']);
  });
});

describe('localStored nested $prop signals', () => {
  let injector: Injector;

  beforeEach(() => {
    localStorage.clear();
    StoreService.userId.set(null);
    TestBed.configureTestingModule({});
    injector = TestBed.inject(Injector);
  });

  afterEach(() => localStorage.clear());

  it('should expose $prop signals on nested objects', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {storageKey: 'ld-nested', version: 1})
    );
    expect(config.sort.$column()).toBe('name');
    expect(config.sort.$direction()).toBe('asc');
  });

  it('should update nested $prop signal after nested mutation', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {storageKey: 'ld-nested', version: 1})
    );
    config.sort.direction = 'desc';
    expect(config.sort.$direction()).toBe('desc');
    expect(config.sort.$column()).toBe('name');
  });

  it('should work at 3 levels of depth', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({a: {b: {c: 'deep'}}}, {storageKey: 'ld-deep', version: 1})
    );
    expect(config.a.b.$c()).toBe('deep');
    config.a.b.c = 'changed';
    expect(config.a.b.$c()).toBe('changed');
    expect(config.a.$b()).toEqual({c: 'changed'});
    expect(config.$a()).toEqual({b: {c: 'changed'}});
  });

  it('should expose $prop on object elements inside arrays', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({items: [{name: 'a'}, {name: 'b'}]}, {storageKey: 'ld-arr-obj', version: 1})
    );
    expect((config.items[0] as any).$name()).toBe('a');
    config.items[0].name = 'z';
    expect((config.items[0] as any).$name()).toBe('z');
  });

  it('should expose $prop after replacing a nested object', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {storageKey: 'ld-replace', version: 1})
    );
    (config as any).sort = {column: 'age', direction: 'desc'};
    expect(config.sort.$column()).toBe('age');
    expect(config.sort.$direction()).toBe('desc');
  });

  it('should expose $prop on dynamically added properties', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {storageKey: 'ld-dyn', version: 1})
    );
    (config.sort as any).extra = 'val';
    expect((config.sort as any).$extra()).toBe('val');
  });

  it('should expose $prop on nested objects after userId reload', () => {
    StoreService.userId.set('alice');
    localStorage.setItem('alice_ld-reload', JSON.stringify({
      _schemaVersion: 1, sort: {column: 'age', direction: 'desc'}
    }));
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {storageKey: 'ld-reload', version: 1})
    );
    expect(config.sort.$column()).toBe('age');

    localStorage.setItem('bob_ld-reload', JSON.stringify({
      _schemaVersion: 1, sort: {column: 'email', direction: 'asc'}
    }));
    StoreService.userId.set('bob');
    TestBed.flushEffects();
    expect(config.sort.$column()).toBe('email');
  });

  it('should expose $prop on objects pushed into arrays', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({items: [{name: 'a'}]}, {storageKey: 'ld-push-obj', version: 1})
    );
    config.items.push({name: 'b'});
    expect((config.items[1] as any).$name()).toBe('b');
  });
});

describe('sessionStored', () => {
  beforeEach(() => {
    sessionStorage.clear();
    StoreService.userId.set(null);
    TestBed.configureTestingModule({});
  });

  afterEach(() => sessionStorage.clear());

  it('should create with initial values and deep tracking', () => {
    const config = TestBed.runInInjectionContext(() =>
      sessionStored({filters: {search: '', active: true}}, {storageKey: 'sd-test'})
    );
    expect(config.filters.search).toBe('');
    expect(config.filters.active).toBe(true);
  });

  it('should persist nested mutations', () => {
    const config = TestBed.runInInjectionContext(() =>
      sessionStored({filters: {search: '', active: true}}, {storageKey: 'sd-test'})
    );
    config.filters.search = 'hello';
    const stored = JSON.parse(sessionStorage.getItem('sd-test') || '{}');
    expect(stored.filters.search).toBe('hello');
    expect(stored._schemaVersion).toBeUndefined();
  });

  it('should expose $-prefixed signals', () => {
    const config = TestBed.runInInjectionContext(() =>
      sessionStored({count: 0}, {storageKey: 'sd-test'})
    );
    config.count = 42;
    expect(config.$count()).toBe(42);
  });
});
