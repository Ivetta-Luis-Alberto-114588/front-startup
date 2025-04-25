import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NeighborhoodListComponent } from './neighborhood-list.component';

describe('NeighborhoodListComponent', () => {
  let component: NeighborhoodListComponent;
  let fixture: ComponentFixture<NeighborhoodListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NeighborhoodListComponent]
    });
    fixture = TestBed.createComponent(NeighborhoodListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
