import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDetailPageComponent } from './order-detail-page.component';

describe('OrderDetailPageComponent', () => {
  let component: OrderDetailPageComponent;
  let fixture: ComponentFixture<OrderDetailPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderDetailPageComponent]
    });
    fixture = TestBed.createComponent(OrderDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
