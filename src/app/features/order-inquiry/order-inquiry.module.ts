import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';


import { OrderTestComponent } from './components/order-test.component';
import { ApiTestComponent } from './components/api-test.component';
import { OrderInquiryLandingComponent } from './components/order-inquiry-landing.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderInquiryComponent } from './components/order-inquiry.component';

@NgModule({
    declarations: [
        OrderInquiryComponent,
        OrderTestComponent,
        ApiTestComponent,
        OrderInquiryLandingComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        RouterModule.forChild([
            {
                path: '',
                component: OrderInquiryComponent
            },
            {
                path: 'buscar',
                component: OrderInquiryLandingComponent
            },
            {
                path: 'test',
                component: OrderTestComponent
            },
            {
                path: 'api-test',
                component: ApiTestComponent
            }
        ])
    ]
})
export class OrderInquiryModule { }
