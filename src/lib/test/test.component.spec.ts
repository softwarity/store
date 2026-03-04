import {ComponentFixture, inject, TestBed} from '@angular/core/testing';

import {TestComponent} from './test.component';
import {USER_ID} from '../common';
import {BehaviorSubject, Observable} from 'rxjs';
import {StoreService} from '../store.service';

describe('Test LocalStored', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        {provide: USER_ID, useFactory: () => new BehaviorSubject('USER')}
      ]
    }).compileComponents();
  });

  beforeEach(inject([USER_ID], (userId$: Observable<string>) => {
    userId$.subscribe(u => StoreService.userId$.next(u));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('Test LocalStored', () => {
    component.local.foo = 6;
    const stored = JSON.parse(localStorage.getItem('USER_test0') || '');
    expect(component.local.foo).toEqual(6);
    expect(stored.foo).toEqual(6);
  });
});
describe('Test SessionStored', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        {provide: USER_ID, useFactory: () => new BehaviorSubject('USER')}
      ]
    }).compileComponents();
  });

  beforeEach(inject([USER_ID], (userId$: Observable<string>) => {
    userId$.subscribe((u: string) => StoreService.userId$.next(u));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('Test SessionStored', () => {
    component.session.foo = 6;
    const stored = JSON.parse(sessionStorage.getItem('USER_test') || '');
    expect(component.session.foo).toEqual(6);
    expect(stored.foo).toEqual(6);
    sessionStorage.clear();
  });

  it('SessionStored deep nested mutation persists', () => {
    component.session.foo = 10;
    const stored = JSON.parse(sessionStorage.getItem('USER_test') || '');
    expect(stored.foo).toEqual(10);
    sessionStorage.clear();
  });
});

describe('Test LocalStored reads pre-existing storage', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    // Pre-populate localStorage with a previously saved value (including id, as saveCfg does)
    localStorage.setItem('USER_test0', JSON.stringify({version: 1, id: 'USER_test0', foo: 42}));

    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        {provide: USER_ID, useFactory: () => new BehaviorSubject('USER')}
      ]
    }).compileComponents();
  });

  beforeEach(inject([USER_ID], (userId$: Observable<string>) => {
    userId$.subscribe(u => StoreService.userId$.next(u));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should load previously persisted value from localStorage', () => {
    expect(component.local.foo).toEqual(42);
  });

  it('should update persisted value after mutation', () => {
    component.local.foo = 99;
    const stored = JSON.parse(localStorage.getItem('USER_test0') || '');
    expect(stored.foo).toEqual(99);
  });
});
