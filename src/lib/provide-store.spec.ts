import {TestBed} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs';
import {StoreService} from './store.service';
import {provideStore} from './provide-store';

describe('provideStore', () => {
  beforeEach(() => {
    StoreService.userId$ = new BehaviorSubject<string | null>(null);
  });

  it('should wire userId$ to StoreService.userId$', () => {
    const userId$ = new BehaviorSubject<string>('alice');

    TestBed.configureTestingModule({
      providers: [provideStore(userId$)]
    });

    // Force initializer to run
    TestBed.inject(StoreService.userId$.constructor as any, undefined, {optional: true});
    // The ENVIRONMENT_INITIALIZER runs when the environment injector is created
    // We need to actually trigger the injector creation
    const envInjector = TestBed.inject(TestBed);

    let value: string | null = null;
    StoreService.userId$.subscribe(v => value = v);
    expect(value).toBe('alice');

    userId$.next('bob');
    expect(StoreService.userId$.getValue()).toBe('bob');
  });

  it('should work without userId$', () => {
    TestBed.configureTestingModule({
      providers: [provideStore()]
    });

    expect(StoreService.userId$.getValue()).toBeNull();
  });
});
