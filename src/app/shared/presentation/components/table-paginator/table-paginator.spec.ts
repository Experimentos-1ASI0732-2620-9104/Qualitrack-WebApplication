import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TablePaginator, paginate } from './table-paginator';

describe('paginate', () => {
  const rowsOf = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

  it('shows the first ten rows', () => {
    const page = paginate(() => rowsOf(23));

    expect(page.rows()).toEqual(rowsOf(10));
    expect(page.length()).toBe(23);
  });

  it('shows the rows of the page chosen, and fewer on the last one', () => {
    const page = paginate(() => rowsOf(23));

    page.pageIndex.set(2);

    expect(page.rows()).toEqual([21, 22, 23]);
  });

  it('shows more rows when the person chooses a bigger page', () => {
    const page = paginate(() => rowsOf(23));

    page.pageSize.set(25);

    expect(page.rows()).toHaveLength(23);
  });

  it('goes back to the first page when a filter changes the rows', () => {
    const rows = signal(rowsOf(23));
    const page = paginate(() => rows());
    page.pageIndex.set(2);

    rows.set(rowsOf(15));

    expect(page.pageIndex()).toBe(0);
    expect(page.rows()).toEqual(rowsOf(10));
  });

  it('keeps the page when a refresh brings the same number of rows', () => {
    const rows = signal(rowsOf(23));
    const page = paginate(() => rows());
    page.pageIndex.set(1);

    rows.set(rowsOf(23));

    expect(page.pageIndex()).toBe(1);
  });
});

describe('TablePaginator', () => {
  @Component({
    standalone: true,
    imports: [TablePaginator],
    template: `<app-table-paginator [page]="page" />`,
  })
  class Host {
    readonly rows = signal<number[]>([]);
    readonly page = paginate(() => this.rows());
  }

  const render = (count: number) => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.rows.set(Array.from({ length: count }, (_, index) => index));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('stays hidden while the table fits in one page of ten', () => {
    expect(render(10).querySelector('mat-paginator')).toBeNull();
  });

  it('appears when the table has more than ten rows', () => {
    expect(render(11).querySelector('mat-paginator')).not.toBeNull();
  });
});
