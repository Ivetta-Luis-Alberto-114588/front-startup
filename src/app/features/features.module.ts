import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from "@angular/router"
import { ProductsModule } from './products/products.module';

@NgModule({
  declarations: [
    // HomeComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    // ProductsModule
  ]
})
export class FeaturesModule { }