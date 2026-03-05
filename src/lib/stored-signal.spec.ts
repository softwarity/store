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
      localStored({pageSize: 5, sort: 'asc'}, {id: 'ld-test', version: 1})
    );
    expect(config.pageSize).toBe(5);
    expect(config.sort).toBe('asc');
  });

  it('should expose $-prefixed signals for each property', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {id: 'ld-test', version: 1})
    );
    expect(config.$pageSize()).toBe(5);
  });

  it('should persist on plain property assignment', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {id: 'ld-test', version: 1})
    );
    config.pageSize = 10;
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.pageSize).toBe(10);
    expect(stored._schemaVersion).toBe(1);
  });

  it('should update $-prefixed signal on property assignment', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {id: 'ld-test', version: 1})
    );
    config.pageSize = 42;
    expect(config.$pageSize()).toBe(42);
  });

  it('should track nested object mutations', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {id: 'ld-test', version: 1})
    );
    config.sort.direction = 'desc';
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.sort.direction).toBe('desc');
    expect(stored.sort.column).toBe('name');
  });

  it('should update $-prefixed signal on nested mutation', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {id: 'ld-test', version: 1})
    );
    config.sort.direction = 'desc';
    expect(config.$sort()).toEqual({column: 'name', direction: 'desc'});
  });

  it('should track array push', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['name', 'age']}, {id: 'ld-test', version: 1})
    );
    config.columns.push('email');
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['name', 'age', 'email']);
  });

  it('should track array splice', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['name', 'age', 'email']}, {id: 'ld-test', version: 1})
    );
    config.columns.splice(1, 1);
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['name', 'email']);
  });

  it('should track array reverse', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['a', 'b', 'c']}, {id: 'ld-test', version: 1})
    );
    config.columns.reverse();
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['c', 'b', 'a']);
  });

  it('should load from storage on creation', () => {
    localStorage.setItem('ld-test', JSON.stringify({_schemaVersion: 1, pageSize: 42}));
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {id: 'ld-test', version: 1})
    );
    expect(config.pageSize).toBe(42);
  });

  it('should use initial value on version mismatch', () => {
    localStorage.setItem('ld-test', JSON.stringify({_schemaVersion: 1, pageSize: 42}));
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {id: 'ld-test', version: 2})
    );
    expect(config.pageSize).toBe(5);
  });

  it('should handle corrupted JSON in storage', () => {
    localStorage.setItem('ld-test', 'NOT_VALID');
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {id: 'ld-test', version: 1})
    );
    expect(config.pageSize).toBe(5);
    expect(localStorage.getItem('ld-test')).toBeNull();
  });

  it('should work with explicit injector option', () => {
    const config = localStored({pageSize: 5}, {id: 'ld-test', version: 1, injector});
    expect(config.pageSize).toBe(5);
  });

  it('should react to userId changes', () => {
    StoreService.userId.set('alice');
    localStorage.setItem('alice_ld-test', JSON.stringify({_schemaVersion: 1, pageSize: 99}));

    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {id: 'ld-test', version: 1})
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
      localStored({items: [{name: 'a'}]}, {id: 'ld-test', version: 1})
    );
    config.items.push({name: 'b'});
    config.items[1].name = 'c';
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.items[1].name).toBe('c');
  });

  it('should persist multiple properties independently', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({count: 0, name: 'test'}, {id: 'ld-test', version: 1})
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
      localStored({columns: ['name', 'age', 'email']}, {id: 'ld-test', version: 1})
    );
    config.columns[0] = 'id';
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['id', 'age', 'email']);
    expect(config.$columns()).toEqual(['id', 'age', 'email']);
  });

  it('should track direct array index assignment with object', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({items: [{name: 'a'}, {name: 'b'}]}, {id: 'ld-test', version: 1})
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
      localStored({sort: {column: 'name', direction: 'asc'}}, {id: 'ld-test', version: 1})
    );
    (config.sort as any).newProp = 'value';
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.sort.newProp).toBe('value');
  });

  it('should track array length = 0', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['name', 'age', 'email']}, {id: 'ld-test', version: 1})
    );
    config.columns.length = 0;
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual([]);
    expect(config.$columns()).toEqual([]);
  });

  it('should not double-wrap already tracked values', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['c', 'a', 'b']}, {id: 'ld-test', version: 1})
    );
    config.columns.sort();
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['a', 'b', 'c']);
    config.columns.reverse();
    const stored2 = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored2.columns).toEqual(['c', 'b', 'a']);
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
      sessionStored({filters: {search: '', active: true}}, {id: 'sd-test'})
    );
    expect(config.filters.search).toBe('');
    expect(config.filters.active).toBe(true);
  });

  it('should persist nested mutations', () => {
    const config = TestBed.runInInjectionContext(() =>
      sessionStored({filters: {search: '', active: true}}, {id: 'sd-test'})
    );
    config.filters.search = 'hello';
    const stored = JSON.parse(sessionStorage.getItem('sd-test') || '{}');
    expect(stored.filters.search).toBe('hello');
    expect(stored._schemaVersion).toBeUndefined();
  });

  it('should expose $-prefixed signals', () => {
    const config = TestBed.runInInjectionContext(() =>
      sessionStored({count: 0}, {id: 'sd-test'})
    );
    config.count = 42;
    expect(config.$count()).toBe(42);
  });
});
