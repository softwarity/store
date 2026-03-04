import {clearLocalStorage, clearSessionStorage} from './storage-utils';

describe('clearLocalStorage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('should clear all localStorage when no prefix', () => {
    localStorage.setItem('a', '1');
    localStorage.setItem('b', '2');
    clearLocalStorage();
    expect(localStorage.length).toBe(0);
  });

  it('should clear only keys with matching prefix', () => {
    localStorage.setItem('app_foo', '1');
    localStorage.setItem('app_bar', '2');
    localStorage.setItem('other', '3');
    clearLocalStorage('app_');
    expect(localStorage.getItem('app_foo')).toBeNull();
    expect(localStorage.getItem('app_bar')).toBeNull();
    expect(localStorage.getItem('other')).toBe('3');
  });

  it('should handle empty storage gracefully', () => {
    expect(() => clearLocalStorage('any_')).not.toThrow();
  });
});

describe('clearSessionStorage', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('should clear all sessionStorage when no prefix', () => {
    sessionStorage.setItem('x', '1');
    clearSessionStorage();
    expect(sessionStorage.length).toBe(0);
  });

  it('should clear only keys with matching prefix', () => {
    sessionStorage.setItem('user_a', '1');
    sessionStorage.setItem('user_b', '2');
    sessionStorage.setItem('keep', '3');
    clearSessionStorage('user_');
    expect(sessionStorage.getItem('user_a')).toBeNull();
    expect(sessionStorage.getItem('user_b')).toBeNull();
    expect(sessionStorage.getItem('keep')).toBe('3');
  });
});
