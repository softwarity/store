import {ENVIRONMENT_INITIALIZER, EnvironmentProviders, Signal, effect, inject, makeEnvironmentProviders, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Observable} from 'rxjs';
import {USER_ID} from './common';
import {StoreService} from './store.service';

export interface StoreConfig {
  userId?: () => Signal<string | null>;
}

/** @deprecated Pass a StoreConfig object instead. */
export function provideStore(userId$: Observable<string>): EnvironmentProviders;
export function provideStore(config?: StoreConfig): EnvironmentProviders;
export function provideStore(configOrObservable?: StoreConfig | Observable<string>): EnvironmentProviders {
  const providers: any[] = [];

  if (!configOrObservable) {
    return makeEnvironmentProviders(providers);
  }

  // Legacy Observable overload (duck-typing)
  if (typeof (configOrObservable as any).subscribe === 'function') {
    const obs$ = configOrObservable as Observable<string>;
    providers.push({
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const sig = toSignal(obs$, {initialValue: null});
        providers.push({provide: USER_ID, useValue: sig});
        effect(() => {
          const uid = sig();
          StoreService.userId.set(uid);
          StoreService._notifyUserIdListeners();
        });
      }
    });
    return makeEnvironmentProviders(providers);
  }

  // New Signal-based config
  const config = configOrObservable as StoreConfig;
  if (config.userId) {
    const userIdFactory = config.userId;
    providers.push({
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const sig = userIdFactory();
        providers.push({provide: USER_ID, useValue: sig});
        effect(() => {
          const uid = sig();
          StoreService.userId.set(uid);
          StoreService._notifyUserIdListeners();
        });
      }
    });
  }

  return makeEnvironmentProviders(providers);
}
