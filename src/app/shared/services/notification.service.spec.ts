import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ToastrService, useValue: spy }
      ]
    });
    
    service = TestBed.inject(NotificationService);
    toastrSpy = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showSuccess', () => {
    it('should call toastr.success with message only', () => {
      const message = 'Operation successful';
      
      service.showSuccess(message);
      
      expect(toastrSpy.success).toHaveBeenCalledWith(message, undefined);
      expect(toastrSpy.success).toHaveBeenCalledTimes(1);
    });

    it('should call toastr.success with message and title', () => {
      const message = 'Operation completed';
      const title = 'Success';
      
      service.showSuccess(message, title);
      
      expect(toastrSpy.success).toHaveBeenCalledWith(message, title);
      expect(toastrSpy.success).toHaveBeenCalledTimes(1);
    });

    it('should handle empty message', () => {
      const message = '';
      
      service.showSuccess(message);
      
      expect(toastrSpy.success).toHaveBeenCalledWith(message, undefined);
    });

    it('should handle long messages', () => {
      const longMessage = 'A'.repeat(500);
      
      service.showSuccess(longMessage);
      
      expect(toastrSpy.success).toHaveBeenCalledWith(longMessage, undefined);
    });
  });

  describe('showError', () => {
    it('should call toastr.error with message only', () => {
      const message = 'An error occurred';
      
      service.showError(message);
      
      expect(toastrSpy.error).toHaveBeenCalledWith(message, undefined, jasmine.any(Object));
      expect(toastrSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should call toastr.error with message and title', () => {
      const message = 'Something went wrong';
      const title = 'Error';
      
      service.showError(message, title);
      
      expect(toastrSpy.error).toHaveBeenCalledWith(message, title, jasmine.any(Object));
      expect(toastrSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should pass error options configuration', () => {
      const message = 'Error message';
      
      service.showError(message);
      
      // Verify that error options are passed (even if commented out in current implementation)
      expect(toastrSpy.error).toHaveBeenCalledWith(message, undefined, jasmine.any(Object));
    });

    it('should handle error messages with special characters', () => {
      const message = 'Error: Special chars éñ @#$%';
      
      service.showError(message);
      
      expect(toastrSpy.error).toHaveBeenCalledWith(message, undefined, jasmine.any(Object));
    });
  });

  describe('showInfo', () => {
    it('should call toastr.info with message only', () => {
      const message = 'Here is some information';
      
      service.showInfo(message);
      
      expect(toastrSpy.info).toHaveBeenCalledWith(message, undefined);
      expect(toastrSpy.info).toHaveBeenCalledTimes(1);
    });

    it('should call toastr.info with message and title', () => {
      const message = 'Important information';
      const title = 'Information';
      
      service.showInfo(message, title);
      
      expect(toastrSpy.info).toHaveBeenCalledWith(message, title);
      expect(toastrSpy.info).toHaveBeenCalledTimes(1);
    });

    it('should handle info messages with HTML content', () => {
      const message = '<strong>Bold information</strong>';
      
      service.showInfo(message);
      
      expect(toastrSpy.info).toHaveBeenCalledWith(message, undefined);
    });
  });

  describe('showWarning', () => {
    it('should call toastr.warning with message only', () => {
      const message = 'This is a warning';
      
      service.showWarning(message);
      
      expect(toastrSpy.warning).toHaveBeenCalledWith(message, undefined);
      expect(toastrSpy.warning).toHaveBeenCalledTimes(1);
    });

    it('should call toastr.warning with message and title', () => {
      const message = 'Proceed with caution';
      const title = 'Warning';
      
      service.showWarning(message, title);
      
      expect(toastrSpy.warning).toHaveBeenCalledWith(message, title);
      expect(toastrSpy.warning).toHaveBeenCalledTimes(1);
    });

    it('should handle warning messages with numbers', () => {
      const message = 'Warning: 5 items remaining';
      
      service.showWarning(message);
      
      expect(toastrSpy.warning).toHaveBeenCalledWith(message, undefined);
    });
  });

  describe('Multiple notifications', () => {
    it('should handle multiple notification calls', () => {
      service.showSuccess('Success message');
      service.showError('Error message');
      service.showInfo('Info message');
      service.showWarning('Warning message');
      
      expect(toastrSpy.success).toHaveBeenCalledTimes(1);
      expect(toastrSpy.error).toHaveBeenCalledTimes(1);
      expect(toastrSpy.info).toHaveBeenCalledTimes(1);
      expect(toastrSpy.warning).toHaveBeenCalledTimes(1);
    });    it('should handle rapid successive calls of same type', () => {
      service.showSuccess('First success');
      service.showSuccess('Second success');
      service.showSuccess('Third success');
      
      expect(toastrSpy.success).toHaveBeenCalledTimes(3);
      expect(toastrSpy.success).toHaveBeenCalledWith('First success', undefined);
      expect(toastrSpy.success).toHaveBeenCalledWith('Second success', undefined);
      expect(toastrSpy.success).toHaveBeenCalledWith('Third success', undefined);
    });
  });

  describe('Edge cases', () => {    it('should handle messages without validation', () => {
      // Service should pass through any message to toastr
      service.showSuccess('Valid message');
      service.showError('Valid error message');
      
      expect(toastrSpy.success).toHaveBeenCalledWith('Valid message', undefined);
      expect(toastrSpy.error).toHaveBeenCalledWith('Valid error message', undefined, jasmine.any(Object));
    });

    it('should handle empty string titles', () => {
      service.showSuccess('Message', '');
      service.showError('Message', '');
      
      expect(toastrSpy.success).toHaveBeenCalledWith('Message', '');
      expect(toastrSpy.error).toHaveBeenCalledWith('Message', '', jasmine.any(Object));
    });

    it('should handle very long titles', () => {
      const longTitle = 'T'.repeat(100);
      
      service.showInfo('Message', longTitle);
      
      expect(toastrSpy.info).toHaveBeenCalledWith('Message', longTitle);
    });

    it('should preserve message formatting and whitespace', () => {
      const messageWithFormatting = '  Message with  spaces  ';
      
      service.showWarning(messageWithFormatting);
      
      expect(toastrSpy.warning).toHaveBeenCalledWith(messageWithFormatting, undefined);
    });
  });

  describe('Service dependency injection', () => {
    it('should inject ToastrService correctly', () => {
      expect(toastrSpy).toBeTruthy();
      expect(typeof toastrSpy.success).toBe('function');
      expect(typeof toastrSpy.error).toBe('function');
      expect(typeof toastrSpy.info).toBe('function');
      expect(typeof toastrSpy.warning).toBe('function');
    });
  });
});
