import {Injector} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs';
import {StoreService} from './store.service';
import {localSignal, localStored, sessionSignal, sessionStored} from './stored-signal';

describe('localSignal', () => {
  let injector: Injector;

  beforeEach(() => {
    localStorage.clear();
    StoreService.userId$ = new BehaviorSubject<string | null>(null);
    TestBed.configureTestingModule({});
    injector = TestBed.inject(Injector);
  });

  afterEach(() => localStorage.clear());

  it('should create with initial values accessible as plain properties', () => {
    const config = TestBed.runInInjectionContext(() =>
      localSignal({foo: 5, bar: 'hello'}, 1, {id: 'ls-test'})
    );
    expect(config.foo).toBe(5);
    expect(config.bar).toBe('hello');
  });

  it('should expose $-prefixed signals for each property', () => {
    const config = TestBed.runInInjectionContext(() =>
      localSignal({foo: 5}, 1, {id: 'ls-test'})
    );
    expect(config.$foo()).toBe(5);
  });

  it('should persist on plain property assignment', () => {
    const config = TestBed.runInInjectionContext(() =>
      localSignal({foo: 5}, 1, {id: 'ls-test'})
    );
    config.foo = 10;
    TestBed.flushEffects();
    const stored = JSON.parse(localStorage.getItem('ls-test') || '{}');
    expect(stored.foo).toBe(10);
    expect(stored._version).toBe(1);
  });

  it('should update $-prefixed signal when property is assigned', () => {
    const config = TestBed.runInInjectionContext(() =>
      localSignal({foo: 5}, 1, {id: 'ls-test'})
    );
    config.foo = 42;
    expect(config.$foo()).toBe(42);
  });

  it('should load from storage on creation', () => {
    localStorage.setItem('ls-test', JSON.stringify({_version: 1, foo: 42}));
    const config = TestBed.runInInjectionContext(() =>
      localSignal({foo: 5}, 1, {id: 'ls-test'})
    );
    expect(config.foo).toBe(42);
    expect(config.$foo()).toBe(42);
  });

  it('should use initial value on version mismatch', () => {
    localStorage.setItem('ls-test', JSON.stringify({_version: 1, foo: 42}));
    const config = TestBed.runInInjectionContext(() =>
      localSignal({foo: 5}, 2, {id: 'ls-test'})
    );
    expect(config.foo).toBe(5);
  });

  it('should handle corrupted JSON in storage', () => {
    localStorage.setItem('ls-test', 'NOT_VALID');
    const config = TestBed.runInInjectionContext(() =>
      localSignal({foo: 5}, 1, {id: 'ls-test'})
    );
    expect(config.foo).toBe(5);
    expect(localStorage.getItem('ls-test')).toBeNull();
  });

  it('should work with explicit injector option', () => {
    const config = localSignal({foo: 5}, 1, {id: 'ls-test', injector});
    expect(config.foo).toBe(5);
  });

  it('should react to userId changes', () => {
    StoreService.userId$.next('alice');
    localStorage.setItem('alice_ls-test', JSON.stringify({_version: 1, foo: 99}));

    const config = TestBed.runInInjectionContext(() =>
      localSignal({foo: 5}, 1, {id: 'ls-test'})
    );
    expect(config.foo).toBe(99);

    localStorage.setItem('bob_ls-test', JSON.stringify({_version: 1, foo: 77}));
    StoreService.userId$.next('bob');
    expect(config.foo).toBe(77);
    expect(config.$foo()).toBe(77);
  });

  it('should persist multiple properties independently', () => {
    const config = TestBed.runInInjectionContext(() =>
      localSignal({count: 0, name: 'test'}, 1, {id: 'ls-test'})
    );
    config.count = 42;
    expect(config.count).toBe(42);
    expect(config.name).toBe('test');
    TestBed.flushEffects();
    const stored = JSON.parse(localStorage.getItem('ls-test') || '{}');
    expect(stored.count).toBe(42);
    expect(stored.name).toBe('test');
  });
});

describe('sessionSignal', () => {
  beforeEach(() => {
    sessionStorage.clear();
    StoreService.userId$ = new BehaviorSubject<string | null>(null);
    TestBed.configureTestingModule({});
  });

  afterEach(() => sessionStorage.clear());

  it('should create with initial values accessible as plain properties', () => {
    const config = TestBed.runInInjectionContext(() =>
      sessionSignal({bar: 'hello'}, {id: 'ss-test'})
    );
    expect(config.bar).toBe('hello');
  });

  it('should persist on plain property assignment', () => {
    const config = TestBed.runInInjectionContext(() =>
      sessionSignal({bar: 'hello'}, {id: 'ss-test'})
    );
    config.bar = 'world';
    TestBed.flushEffects();
    const stored = JSON.parse(sessionStorage.getItem('ss-test') || '{}');
    expect(stored.bar).toBe('world');
    expect(stored._version).toBeUndefined();
  });

  it('should load from storage regardless of version', () => {
    sessionStorage.setItem('ss-test', JSON.stringify({bar: 'stored'}));
    const config = TestBed.runInInjectionContext(() =>
      sessionSignal({bar: 'hello'}, {id: 'ss-test'})
    );
    expect(config.bar).toBe('stored');
    expect(config.$bar()).toBe('stored');
  });
});

describe('localStored', () => {
  let injector: Injector;

  beforeEach(() => {
    localStorage.clear();
    StoreService.userId$ = new BehaviorSubject<string | null>(null);
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
    TestBed.flushEffects();
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.pageSize).toBe(10);
    expect(stored._version).toBe(1);
  });

  it('should track nested object mutations', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({sort: {column: 'name', direction: 'asc'}}, {id: 'ld-test', version: 1})
    );
    config.sort.direction = 'desc';
    TestBed.flushEffects();
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
    TestBed.flushEffects();
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['name', 'age', 'email']);
  });

  it('should track array splice', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['name', 'age', 'email']}, {id: 'ld-test', version: 1})
    );
    config.columns.splice(1, 1);
    TestBed.flushEffects();
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['name', 'email']);
  });

  it('should track array reverse', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({columns: ['a', 'b', 'c']}, {id: 'ld-test', version: 1})
    );
    config.columns.reverse();
    TestBed.flushEffects();
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.columns).toEqual(['c', 'b', 'a']);
  });

  it('should load from storage on creation', () => {
    localStorage.setItem('ld-test', JSON.stringify({_version: 1, pageSize: 42}));
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {id: 'ld-test', version: 1})
    );
    expect(config.pageSize).toBe(42);
  });

  it('should use initial value on version mismatch', () => {
    localStorage.setItem('ld-test', JSON.stringify({_version: 1, pageSize: 42}));
    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {id: 'ld-test', version: 2})
    );
    expect(config.pageSize).toBe(5);
  });

  it('should work with explicit injector option', () => {
    const config = localStored({pageSize: 5}, {id: 'ld-test', version: 1, injector});
    expect(config.pageSize).toBe(5);
  });

  it('should react to userId changes', () => {
    StoreService.userId$.next('alice');
    localStorage.setItem('alice_ld-test', JSON.stringify({_version: 1, pageSize: 99}));

    const config = TestBed.runInInjectionContext(() =>
      localStored({pageSize: 5}, {id: 'ld-test', version: 1})
    );
    expect(config.pageSize).toBe(99);

    localStorage.setItem('bob_ld-test', JSON.stringify({_version: 1, pageSize: 77}));
    StoreService.userId$.next('bob');
    expect(config.pageSize).toBe(77);
    expect(config.$pageSize()).toBe(77);
  });

  it('should track deep mutations on pushed objects', () => {
    const config = TestBed.runInInjectionContext(() =>
      localStored({items: [{name: 'a'}]}, {id: 'ld-test', version: 1})
    );
    config.items.push({name: 'b'});
    config.items[1].name = 'c';
    TestBed.flushEffects();
    const stored = JSON.parse(localStorage.getItem('ld-test') || '{}');
    expect(stored.items[1].name).toBe('c');
  });
});

describe('sessionStored', () => {
  beforeEach(() => {
    sessionStorage.clear();
    StoreService.userId$ = new BehaviorSubject<string | null>(null);
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
    TestBed.flushEffects();
    const stored = JSON.parse(sessionStorage.getItem('sd-test') || '{}');
    expect(stored.filters.search).toBe('hello');
    expect(stored._version).toBeUndefined();
  });

  it('should expose $-prefixed signals', () => {
    const config = TestBed.runInInjectionContext(() =>
      sessionStored({count: 0}, {id: 'sd-test'})
    );
    config.count = 42;
    expect(config.$count()).toBe(42);
  });
});
