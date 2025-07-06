import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CheckoutPageComponent } from './components/checkout-page/checkout-page.component';
import { CheckoutTestingComponent } from './components/checkout-testing/checkout-testing.component';

const routes: Routes = [
  { path: '', component: CheckoutPageComponent },
  { path: 'testing', component: CheckoutTestingComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CheckoutRoutingModule { }
