import {FakeStorage} from './fake-storage';

describe('FakeStorage', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
  });

  it('should have length 0', () => {
    expect(storage.length).toBe(0);
  });

  it('getItem should return null', () => {
    expect(storage.getItem('any')).toBeNull();
  });

  it('key should return null', () => {
    expect(storage.key(0)).toBeNull();
  });

  it('setItem should not throw', () => {
    expect(() => storage.setItem('key', 'value')).not.toThrow();
  });

  it('removeItem should not throw', () => {
    expect(() => storage.removeItem('key')).not.toThrow();
  });

  it('clear should not throw', () => {
    expect(() => storage.clear()).not.toThrow();
  });
});
