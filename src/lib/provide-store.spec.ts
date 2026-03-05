import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs';
import {StoreService} from './store.service';
import {provideStore} from './provide-store';

describe('provideStore', () => {
  beforeEach(() => {
    StoreService.userId.set(null);
  });

  it('should wire signal-based config to StoreService.userId', () => {
    const userSig = signal<string | null>('alice');

    TestBed.configureTestingModule({
      providers: [provideStore({userId: () => userSig})]
    });

    // Force initializer to run
    TestBed.flushEffects();

    expect(StoreService.userId()).toBe('alice');
  });

  it('should react to signal changes', () => {
    const userSig = signal<string | null>('alice');

    TestBed.configureTestingModule({
      providers: [provideStore({userId: () => userSig})]
    });

    TestBed.flushEffects();
    expect(StoreService.userId()).toBe('alice');

    userSig.set('bob');
    TestBed.flushEffects();
    expect(StoreService.userId()).toBe('bob');
  });

  it('should work without config', () => {
    TestBed.configureTestingModule({
      providers: [provideStore()]
    });

    expect(StoreService.userId()).toBeNull();
  });

  it('should support legacy Observable overload', () => {
    const userId$ = new BehaviorSubject<string>('alice');

    TestBed.configureTestingModule({
      providers: [provideStore(userId$)]
    });

    TestBed.flushEffects();
    expect(StoreService.userId()).toBe('alice');

    userId$.next('bob');
    TestBed.flushEffects();
    expect(StoreService.userId()).toBe('bob');
  });
});
