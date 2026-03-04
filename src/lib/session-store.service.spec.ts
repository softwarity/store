import {SessionStoreService} from './store.service';

describe('SessionStoreService', () => {
  let service: SessionStoreService;

  beforeAll(() => service = new SessionStoreService());

  beforeEach(() => sessionStorage.clear());

  afterAll(() => sessionStorage.clear());

  it('should use sessionStorage', () => {
    expect(service.getStorage()).toBe(sessionStorage);
  });

  it('At first load, store is not updated', () => {
    service.loadCfg({version: 1, id: 'session_test', foo: 5});
    const stored = sessionStorage.getItem('session_test');
    expect(stored).toBeNull();
  });

  it('Update primitive value on deep 1', () => {
    const res = service.loadCfg({version: 1, id: 'session_test', foo: 5});
    res.foo = 6;
    const stored = JSON.parse(sessionStorage.getItem('session_test') || '{}');
    expect(stored.foo).toEqual(6);
  });

  it('Update object value on deep 2', () => {
    const res = service.loadCfg({version: 1, id: 'session_test', foo: {bar: 5}});
    res.foo.bar = 6;
    const stored = JSON.parse(sessionStorage.getItem('session_test') || '{}');
    expect(stored.foo.bar).toEqual(6);
  });

  it('Update array by push value', () => {
    const res = service.loadCfg({version: 1, id: 'session_test', foo: []});
    res.foo.push(6);
    const stored = JSON.parse(sessionStorage.getItem('session_test') || '{}');
    expect(stored.foo.length).toEqual(1);
  });

  it('toJson function', () => {
    const cfg = service.loadCfg({version: 1, id: 'session_test', foo: 5});
    expect(cfg.toJson()).toBeTruthy();
    expect(cfg.toJson().id).toBeUndefined();
    expect(cfg.toJson().version).toBeUndefined();
  });
});
