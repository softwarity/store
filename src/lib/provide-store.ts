import {DestroyRef, ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, makeEnvironmentProviders} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Observable} from 'rxjs';
import {USER_ID} from './common';
import {StoreService} from './store.service';

export function provideStore(userId$?: Observable<string>): EnvironmentProviders {
  const providers: any[] = [];

  if (userId$) {
    providers.push({provide: USER_ID, useValue: userId$});
    providers.push({
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        const destroyRef = inject(DestroyRef);
        userId$.pipe(takeUntilDestroyed(destroyRef)).subscribe(u => StoreService.userId$.next(u));
      }
    });
  }

  return makeEnvironmentProviders(providers);
}
