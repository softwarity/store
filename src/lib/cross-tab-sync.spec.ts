import {onStorageChange} from './cross-tab-sync';

describe('onStorageChange', () => {
  it('should call callback when matching key changes', () => {
    const values: any[] = [];
    const handle = onStorageChange<{foo: number}>('test-key', v => values.push(v));

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'test-key',
      newValue: JSON.stringify({foo: 42})
    }));

    expect(values).toEqual([{foo: 42}]);
    handle.destroy();
  });

  it('should ignore events for other keys', () => {
    const values: any[] = [];
    const handle = onStorageChange('test-key', v => values.push(v));

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'other-key',
      newValue: '{"a":1}'
    }));

    expect(values).toEqual([]);
    handle.destroy();
  });

  it('should pass null when key is removed', () => {
    const values: any[] = [];
    const handle = onStorageChange('test-key', v => values.push(v));

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'test-key',
      newValue: null
    }));

    expect(values).toEqual([null]);
    handle.destroy();
  });

  it('should pass null on corrupted JSON', () => {
    const values: any[] = [];
    const handle = onStorageChange('test-key', v => values.push(v));

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'test-key',
      newValue: 'NOT_VALID'
    }));

    expect(values).toEqual([null]);
    handle.destroy();
  });

  it('should stop listening after destroy', () => {
    const values: any[] = [];
    const handle = onStorageChange('test-key', v => values.push(v));
    handle.destroy();

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'test-key',
      newValue: '{"a":1}'
    }));

    expect(values).toEqual([]);
  });
});
