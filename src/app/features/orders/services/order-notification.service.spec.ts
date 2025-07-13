import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderNotificationService } from './order-notification.service';

const mockPayload = {
    subject: 'Test',
    message: 'Mensaje',
    emailTo: 'test@email.com',
    telegramChatId: '-1001234567890'
};

describe('OrderNotificationService', () => {
    let service: OrderNotificationService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [OrderNotificationService]
        });
        service = TestBed.inject(OrderNotificationService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('debe enviar notificación manual correctamente', () => {
        service.sendManualNotification(mockPayload).subscribe();
        const req = httpMock.expectOne('/api/notifications/manual');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockPayload);
        req.flush({ success: true });
    });
});
