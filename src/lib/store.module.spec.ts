import {TestBed} from '@angular/core/testing';
import {StoreModule, defaultUserIdFactory} from './store.module';
import {StoreService} from './store.service';
import {BehaviorSubject} from 'rxjs';

describe('StoreModule', () => {
  it('defaultUserIdFactory should return a BehaviorSubject with empty string', () => {
    const result = defaultUserIdFactory();
    let value: string | undefined;
    result.subscribe(v => value = v);
    expect(value).toBe('');
  });

  it('should wire USER_ID to StoreService.userId$', async () => {
    // Reset the static BehaviorSubject before test
    StoreService.userId$ = new BehaviorSubject<string | null>(null);

    await TestBed.configureTestingModule({
      imports: [StoreModule]
    }).compileComponents();

    // Force module instantiation
    TestBed.inject(StoreModule);

    let value: string | null = null;
    StoreService.userId$.subscribe(v => value = v);
    expect(value).toBe('');
  });
});
