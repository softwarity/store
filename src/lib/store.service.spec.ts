import {LocalStoreService, SessionStoreService, StoreService} from './store.service';
import {BehaviorSubject} from 'rxjs';

describe('StoreService', () => {
  let service: LocalStoreService;

  beforeAll(() => service = new LocalStoreService());

  beforeEach(() => localStorage.clear());

  afterAll(() => localStorage.clear());

  it('At first load, store is not update', () => {
    service.loadCfg({version: 1, id: 'test', foo: 5});
    const stored = localStorage.getItem('test');
    expect(stored).toBeNull();
  });

  it('toJson function', () => {
    const cfg = service.loadCfg({version: 1, id: 'test', foo: 5});
    expect(cfg.toJson()).toBeTruthy();
    expect(cfg.toJson().id).toBeUndefined();
    expect(cfg.toJson().version).toBeUndefined();
  });

  it('Update primitive value on deep 1', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: 5});
    res.foo = 6;
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual(6);
  });

  it('Update primitive value on deep 2', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: {bar: 5}});
    res.foo.bar = 6;
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo.bar).toEqual(6);
  });

  it('Update object value on deep 1', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: {bar: 5}});
    res.foo = {bar: 6};
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo.bar).toEqual(6);
  });

  it('Update array by set value on deep 1', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: []});
    res.foo = [10];
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo.length).toEqual(1);
  });

  it('Update array by push value', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: []});
    res.foo.push(6);
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo.length).toEqual(1);
  });

  it('Update array by unshift value', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: []});
    res.foo.unshift(6);
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo.length).toEqual(1);
  });

  it('Update array by pop value', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: [1, 2]});
    res.foo.pop();
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo.length).toEqual(1);
  });

  it('Update array by shift value', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: [1, 2]});
    res.foo.shift();
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo.length).toEqual(1);
  });

  it('Update array by copyWithin value', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: ['a', 'b', 'c', 'd', 'e']});
    res.foo.copyWithin(0, 3, 4);
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual(['d', 'b', 'c', 'd', 'e']);
  });

  it('Update array by fill value', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: [1, 2, 3, 4]});
    res.foo.fill(0, 2, 4);
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual([1, 2, 0, 0]);
  });

  it('Update array by reverse value', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: ['one', 'two', 'three']});
    res.foo.reverse();
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual(['three', 'two', 'one']);
  });

  it('Update array by sort value', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: [1, 30, 4, 21, 100000]});
    res.foo.sort();
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual([1, 100000, 21, 30, 4]);
  });

  it('Update array by splice value', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: ['Jan', 'March', 'April', 'June']});
    res.foo.splice(1, 0, 'Feb');
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual(['Jan', 'Feb', 'March', 'April', 'June']);
  });

  it('Test repudiation', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: 5});
    res.foo = 6;
    let stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual(6);

    service.loadCfg({version: 1, id: 'test', foo: 7});
    stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual(6);

    service.loadCfg({version: 2, id: 'test', foo: 7});
    stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual(7);
  });

  it('Update nested array by push value', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: [['one', 'two', 'three'], [1, 2, 3]]});
    res.foo[1].push(4);
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo[1].length).toEqual(4);
  });

  it('getId with id', () => {
    const id = StoreService.getId('', {constructor: {name: 'MyComponent'}}, 'cfg', 'test');
    expect(id).toEqual('test');
  });

  it('getId without id', () => {
    const id = StoreService.getId('', {constructor: {name: 'MyComponent'}}, 'cfg');
    expect(id).toEqual('MyComponent.cfg');
  });

  it('getId with userId, with id', () => {
    const id = StoreService.getId('foo', {constructor: {name: 'MyComponent'}}, 'cfg', 'test');
    expect(id).toEqual('foo_test');
  });

  it('getId with userId, without id', () => {
    const id = StoreService.getId('foo', {constructor: {name: 'MyComponent'}}, 'cfg');
    expect(id).toEqual('foo_MyComponent.cfg');
  });

  it('getId with null userId returns suffix only', () => {
    const id = StoreService.getId(null, {constructor: {name: 'MyComponent'}}, 'cfg', 'test');
    expect(id).toEqual('test');
  });

  it('getId with null userId and no id returns ClassName.key', () => {
    const id = StoreService.getId(null, {constructor: {name: 'MyComponent'}}, 'cfg');
    expect(id).toEqual('MyComponent.cfg');
  });

  it('Round-trip: loadCfg reads previously saved value with same version', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: 'initial'});
    res.foo = 'modified';
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual('modified');

    const res2 = service.loadCfg({version: 1, id: 'test', foo: 'initial'});
    expect(res2.foo).toEqual('modified');
  });

  it('version and id are readonly', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: 5});
    expect(res.version).toEqual(1);
    expect(res.id).toEqual('test');

    // Attempting to set should have no effect (no setter defined)
    expect(() => { res.version = 99; }).toThrow();
    expect(() => { res.id = 'other'; }).toThrow();
    expect(res.version).toEqual(1);
    expect(res.id).toEqual('test');
  });

  it('Store and retrieve boolean values', () => {
    const res = service.loadCfg({version: 1, id: 'test', flag: false});
    res.flag = true;
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.flag).toBe(true);
  });

  it('Store and retrieve string values', () => {
    const res = service.loadCfg({version: 1, id: 'test', name: 'hello'});
    res.name = 'world';
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.name).toEqual('world');
  });

  it('toJson with null value preserves null', () => {
    const res = service.loadCfg({version: 1, id: 'test', val: null});
    const json = res.toJson();
    expect(json.val).toBeNull();
  });

  it('toJson with zero value preserves zero', () => {
    const res = service.loadCfg({version: 1, id: 'test', val: 0});
    res.val = 0;
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.val).toBe(0);
  });

  it('toJson with false value preserves false', () => {
    const res = service.loadCfg({version: 1, id: 'test', val: false});
    res.val = false;
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.val).toBe(false);
  });

  it('toJson with empty string preserves empty string', () => {
    const res = service.loadCfg({version: 1, id: 'test', val: ''});
    res.val = '';
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.val).toBe('');
  });

  it('Deep 3 nesting: update deep nested property', () => {
    const res = service.loadCfg({version: 1, id: 'test', a: {b: {c: 1}}});
    res.a.b.c = 42;
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.a.b.c).toEqual(42);
  });

  it('Replace deep nested object triggers save', () => {
    const res = service.loadCfg({version: 1, id: 'test', a: {b: {c: 1}}});
    res.a.b = {c: 99, d: 'new'};
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.a.b.c).toEqual(99);
    expect(stored.a.b.d).toEqual('new');
  });

  it('Mutation of object inside array triggers save', () => {
    const res = service.loadCfg({version: 1, id: 'test', items: [{name: 'a'}, {name: 'b'}]});
    res.items[0].name = 'updated';
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.items[0].name).toEqual('updated');
  });

  it('Multiple properties on same config', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: 1, bar: 'x', baz: true});
    res.foo = 2;
    res.bar = 'y';
    res.baz = false;
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual(2);
    expect(stored.bar).toEqual('y');
    expect(stored.baz).toBe(false);
  });

  it('Version mismatch overwrites storage with new config', () => {
    localStorage.setItem('test', JSON.stringify({version: 1, foo: 'old'}));
    const res = service.loadCfg({version: 2, id: 'test', foo: 'new', extra: true});
    expect(res.foo).toEqual('new');
    expect(res.extra).toBe(true);
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual('new');
    expect(stored.extra).toBe(true);
  });

  it('toJson on config with nested array of objects', () => {
    const res = service.loadCfg({version: 1, id: 'test', items: [{a: 1}, {a: 2}]});
    const json = res.toJson();
    expect(json.items).toEqual([{a: 1}, {a: 2}]);
    expect(json.version).toBeUndefined();
    expect(json.id).toBeUndefined();
  });

  it('getUserId$ emits when userId$ changes', () => {
    const original = StoreService.userId$;
    StoreService.userId$ = new BehaviorSubject<string | null>(null);

    const values: (string | null)[] = [];
    service.getUserId$().subscribe(v => values.push(v));

    expect(values).toEqual([]);

    StoreService.userId$.next('alice');
    expect(values).toEqual(['alice']);

    StoreService.userId$.next('bob');
    expect(values).toEqual(['alice', 'bob']);

    // null is filtered out
    StoreService.userId$.next(null);
    expect(values).toEqual(['alice', 'bob']);

    StoreService.userId$ = original;
  });

  it('LocalStoreService.getStorage returns localStorage', () => {
    expect(service.getStorage()).toBe(localStorage);
  });

  it('Array push with object triggers deep tracking', () => {
    const res = service.loadCfg({version: 1, id: 'test', items: []});
    res.items.push({name: 'new'});
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.items.length).toEqual(1);
    expect(stored.items[0].name).toEqual('new');
  });

  it('Array splice to remove and insert', () => {
    const res = service.loadCfg({version: 1, id: 'test', foo: [1, 2, 3, 4, 5]});
    res.foo.splice(1, 2, 10, 20);
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.foo).toEqual([1, 10, 20, 4, 5]);
  });

  it('Config with empty object property', () => {
    const res = service.loadCfg({version: 1, id: 'test', child: {}});
    res.child = {newProp: 'value'};
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.child.newProp).toEqual('value');
  });

  it('Corrupted JSON in storage falls back gracefully', () => {
    localStorage.setItem('test', 'NOT_VALID_JSON{{{');
    const res = service.loadCfg({version: 1, id: 'test', foo: 'default'});
    expect(res.foo).toEqual('default');
    // corrupted entry should be removed
    expect(localStorage.getItem('test')).toBeNull();
  });

  it('QuotaExceededError does not crash', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    };
    try {
      const res = service.loadCfg({version: 1, id: 'test', foo: 5});
      // mutation should not throw
      expect(() => { res.foo = 6; }).not.toThrow();
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      Storage.prototype.setItem = originalSetItem;
      warnSpy.mockRestore();
    }
  });

  it('Falsy values (0, false, empty string) in nested objects are preserved', () => {
    const res = service.loadCfg({version: 1, id: 'test', obj: {a: 0, b: false, c: ''}});
    res.obj.a = 0;
    res.obj.b = false;
    res.obj.c = '';
    const stored = JSON.parse(localStorage.getItem('test') || '{}');
    expect(stored.obj.a).toBe(0);
    expect(stored.obj.b).toBe(false);
    expect(stored.obj.c).toBe('');
  });

  it('SessionStoreService.getStorage returns sessionStorage', () => {
    const sessionService = new SessionStoreService();
    expect(sessionService.getStorage()).toBe(sessionStorage);
  });

  it('loadCfg with undefined version loads from storage regardless of stored version', () => {
    localStorage.setItem('test', JSON.stringify({version: 5, foo: 'stored'}));
    const res = service.loadCfg({id: 'test', foo: 'default'});
    expect(res.foo).toEqual('stored');
  });
});
