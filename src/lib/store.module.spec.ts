import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {StoreModule, defaultUserIdFactory} from './store.module';
import {StoreService} from './store.service';
import {USER_ID} from './common';
import {BehaviorSubject} from 'rxjs';

describe('StoreModule', () => {
  it('defaultUserIdFactory should return a signal with empty string', () => {
    const result = defaultUserIdFactory();
    expect(result()).toBe('');
  });

  it('should wire USER_ID signal to StoreService.userId', async () => {
    StoreService.userId.set(null);

    await TestBed.configureTestingModule({
      imports: [StoreModule]
    }).compileComponents();

    // Force module instantiation
    TestBed.inject(StoreModule);
    TestBed.flushEffects();

    expect(StoreService.userId()).toBe('');
  });

  it('should support legacy Observable USER_ID token', async () => {
    StoreService.userId.set(null);

    await TestBed.configureTestingModule({
      imports: [StoreModule],
      providers: [
        {provide: USER_ID, useValue: new BehaviorSubject('legacyUser')}
      ]
    }).compileComponents();

    TestBed.inject(StoreModule);
    TestBed.flushEffects();

    expect(StoreService.userId()).toBe('legacyUser');
  });
});
