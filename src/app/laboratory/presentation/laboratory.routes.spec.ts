import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { laboratoryRoutes } from './laboratory.routes';

@Component({ template: '' })
class Destination {}

describe('Legacy laboratory material links', () => {
  it('redirects the old material URL to Inventory while preserving the identifier', async () => {
    const redirect = laboratoryRoutes.find((route) => route.children)?.children?.find((route) => route.path === 'raw-materials/:id');
    expect(redirect).toBeDefined();
    TestBed.configureTestingModule({ providers: [provideRouter([
      { path: 'laboratories', children: [redirect!] },
      { path: 'inventory/legacy-materials/:id', component: Destination },
    ])] });
    await RouterTestingHarness.create('/laboratories/raw-materials/12');
    expect(TestBed.inject(Router).url).toBe('/inventory/legacy-materials/12');
  });
});
