import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { LocalStored, SessionStored, localStored, sessionStored } from '@softwarity/store';
import { registerInteractiveCode } from '@softwarity/interactive-code';

registerInteractiveCode();

interface Employee {
  name: string;
  age: number;
  email: string;
  role: string;
  status: string;
}

const EMPLOYEES: Employee[] = [
  {name: 'Alice Martin', age: 28, email: 'alice@acme.com', role: 'Developer', status: 'Active'},
  {name: 'Bob Johnson', age: 35, email: 'bob@acme.com', role: 'Designer', status: 'Active'},
  {name: 'Charlie Brown', age: 42, email: 'charlie@acme.com', role: 'Manager', status: 'Away'},
  {name: 'Diana Prince', age: 31, email: 'diana@acme.com', role: 'Developer', status: 'Active'},
  {name: 'Edward Norton', age: 45, email: 'edward@acme.com', role: 'Architect', status: 'Active'},
  {name: 'Fiona Green', age: 27, email: 'fiona@acme.com', role: 'Designer', status: 'Active'},
  {name: 'George Wilson', age: 38, email: 'george@acme.com', role: 'Manager', status: 'Away'},
  {name: 'Hannah Lee', age: 29, email: 'hannah@acme.com', role: 'Developer', status: 'Active'},
  {name: 'Ivan Petrov', age: 33, email: 'ivan@acme.com', role: 'DevOps', status: 'Active'},
  {name: 'Julia Chen', age: 40, email: 'julia@acme.com', role: 'Architect', status: 'Inactive'},
  {name: 'Kevin Hart', age: 26, email: 'kevin@acme.com', role: 'Developer', status: 'Active'},
  {name: 'Laura Palmer', age: 34, email: 'laura@acme.com', role: 'Designer', status: 'Active'},
];

@Component({
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule, MatMenuModule, MatPaginatorModule, MatSortModule, MatTableModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './playground.component.html',
  styleUrl: './playground.component.scss'
})
export class PlaygroundComponent {

  readonly allColumns = [
    {key: 'name', label: 'Name'},
    {key: 'age', label: 'Age'},
    {key: 'email', label: 'Email'},
    {key: 'role', label: 'Role'},
    {key: 'status', label: 'Status'},
  ];

  private static defaults() {
    return {columns: ['name', 'age', 'email'], sort: {column: 'name', direction: 'asc'}, pageSize: 5, pageIndex: 0};
  }

  // --- 4 configs: same shape, 4 storage backends ---

  @LocalStored(1, 'demo-decorator-local')
  private _decoratorLocal = PlaygroundComponent.defaults();

  @SessionStored('demo-decorator-session')
  private _decoratorSession = PlaygroundComponent.defaults();

  private _storedLocal = localStored(PlaygroundComponent.defaults(), {storageKey: 'demo-stored-local', version: 1});
  private _storedSession = sessionStored(PlaygroundComponent.defaults(), {storageKey: 'demo-stored-session'});

  // --- API selector ---

  selectedApi = signal('LocalStored');

  config = computed((): any => {
    switch (this.selectedApi()) {
      case 'LocalStored':   return this._decoratorLocal;
      case 'SessionStored': return this._decoratorSession;
      case 'localStored':   return this._storedLocal;
      case 'sessionStored': return this._storedSession;
      default:              return this._decoratorLocal;
    }
  });

  setApi(api: string): void {
    this.selectedApi.set(api);
  }

  // --- Computed signals ---

  displayedColumns = computed(() => [...this.config().$columns(), '_settings']);

  pagedData = computed(() => {
    const cfg = this.config();
    const col = cfg.sort.$column();
    const dir = cfg.sort.$direction() === 'desc' ? -1 : 1;
    const ps = cfg.$pageSize();
    const pi = cfg.$pageIndex();
    const sorted = [...EMPLOYEES].sort((a: any, b: any) => {
      const va = a[col];
      const vb = b[col];
      if (typeof va === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return sorted.slice(pi * ps, (pi + 1) * ps);
  });

  // --- Column helpers ---

  toggleColumn(key: string): void {
    const cols = this.config().columns;
    const idx = cols.indexOf(key);
    if (idx >= 0) {
      if (cols.length > 1) cols.splice(idx, 1);
    } else {
      cols.push(key);
    }
  }

  // --- Sort helpers ---

  onSort(event: Sort): void {
    const cfg = this.config();
    cfg.sort.column = event.active;
    cfg.sort.direction = event.direction || 'asc';
  }

  // --- Pagination helpers ---

  onPage(event: PageEvent): void {
    const cfg = this.config();
    cfg.pageSize = event.pageSize;
    cfg.pageIndex = event.pageIndex;
  }

  // --- Reset ---

  resetConfig(): void {
    const d = PlaygroundComponent.defaults();
    const cfg = this.config();
    cfg.columns = d.columns;
    cfg.sort = d.sort;
    cfg.pageSize = d.pageSize;
    cfg.pageIndex = d.pageIndex;
  }

  // --- Storage inspector ---

  storageType = computed(() => {
    const api = this.selectedApi();
    return (api === 'LocalStored' || api === 'localStored') ? 'localStorage' : 'sessionStorage';
  });

  activeStorageKey = computed(() => {
    switch (this.selectedApi()) {
      case 'LocalStored':   return 'demo-decorator-local';
      case 'SessionStored': return 'demo-decorator-session';
      case 'localStored':   return 'demo-stored-local';
      case 'sessionStored': return 'demo-stored-session';
      default:              return '';
    }
  });

  storageContent = computed(() => {
    // Read config signals to trigger recalculation on any config change
    const cfg = this.config();
    cfg.$columns();
    cfg.sort.$column();
    cfg.sort.$direction();
    cfg.$pageSize();
    cfg.$pageIndex();
    const storage = (this.selectedApi() === 'LocalStored' || this.selectedApi() === 'localStored') ? localStorage : sessionStorage;
    const raw = storage.getItem(this.activeStorageKey());
    if (!raw) return '(empty)';
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  });
}
