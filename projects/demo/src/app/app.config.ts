import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { provideStore } from '@softwarity/store';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideStore(new BehaviorSubject(''))
  ]
};
