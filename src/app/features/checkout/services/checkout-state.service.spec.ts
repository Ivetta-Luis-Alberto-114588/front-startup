import { TestBed } from '@angular/core/testing';
import { CheckoutStateService, ShippingAddressOption } from './checkout-state.service';
import { IAddress } from '../../customers/models/iaddress';
import { ICity } from '../../customers/models/icity';
import { INeighborhood } from '../../customers/models/ineighborhood';

describe('CheckoutStateService', () => {
  let service: CheckoutStateService;

  const mockCity: ICity = {
    id: 'city1',
    name: 'Test City',
    description: 'Test City Description',
    isActive: true
  };

  const mockNeighborhood: INeighborhood = {
    id: 'neighborhood1',
    name: 'Test Neighborhood',
    description: 'Test Neighborhood Description',
    city: mockCity,
    isActive: true
  };

  const mockExistingAddress: IAddress = {
    id: '1',
    customerId: 'customer1',
    recipientName: 'John Doe',
    phone: '+1234567890',
    streetAddress: 'Main St 123',
    neighborhood: mockNeighborhood,
    city: mockCity,
    isDefault: true,
    alias: 'Home',
    additionalInfo: 'Apartment 2B',
    postalCode: '12345'
  };

  const mockExistingAddressOption: ShippingAddressOption = {
    type: 'existing',
    address: mockExistingAddress
  };
  const mockNewAddressOption: ShippingAddressOption = {
    type: 'new',
    addressData: {
      recipientName: 'Jane Smith',
      phone: '+0987654321',
      streetAddress: 'New St 456',
      cityId: 'city2',
      neighborhoodId: 'neighborhood2',
      additionalInfo: 'Suite 100',
      postalCode: '67890',
      alias: 'Office'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CheckoutStateService]
    });
    service = TestBed.inject(CheckoutStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with null shipping address', () => {
      expect(service.getSelectedShippingAddress()).toBeNull();
    });

    it('should have observable that emits null initially', (done) => {
      service.shippingAddress$.subscribe(address => {
        expect(address).toBeNull();
        done();
      });
    });
  });

  describe('setSelectedShippingAddress', () => {
    it('should set existing address option', () => {
      service.setSelectedShippingAddress(mockExistingAddressOption);
      
      const currentAddress = service.getSelectedShippingAddress();
      expect(currentAddress).toEqual(mockExistingAddressOption);
      expect(currentAddress?.type).toBe('existing');
      if (currentAddress?.type === 'existing') {
        expect(currentAddress.address).toEqual(mockExistingAddress);
      }
    });

    it('should set new address option', () => {
      service.setSelectedShippingAddress(mockNewAddressOption);
      
      const currentAddress = service.getSelectedShippingAddress();
      expect(currentAddress).toEqual(mockNewAddressOption);
      expect(currentAddress?.type).toBe('new');
      if (currentAddress?.type === 'new') {
        expect(currentAddress.addressData).toEqual(mockNewAddressOption.addressData);
      }
    });

    it('should set address to null', () => {
      // First set an address
      service.setSelectedShippingAddress(mockExistingAddressOption);
      expect(service.getSelectedShippingAddress()).not.toBeNull();

      // Then set to null
      service.setSelectedShippingAddress(null);
      expect(service.getSelectedShippingAddress()).toBeNull();
    });

    it('should update previously set address', () => {
      // Set initial address
      service.setSelectedShippingAddress(mockExistingAddressOption);
      expect(service.getSelectedShippingAddress()?.type).toBe('existing');

      // Update to new address
      service.setSelectedShippingAddress(mockNewAddressOption);
      expect(service.getSelectedShippingAddress()?.type).toBe('new');
    });
  });

  describe('getSelectedShippingAddress', () => {
    it('should return current address value for existing address', () => {
      service.setSelectedShippingAddress(mockExistingAddressOption);
      
      const address = service.getSelectedShippingAddress();
      expect(address).toEqual(mockExistingAddressOption);
    });

    it('should return current address value for new address', () => {
      service.setSelectedShippingAddress(mockNewAddressOption);
      
      const address = service.getSelectedShippingAddress();
      expect(address).toEqual(mockNewAddressOption);
    });

    it('should return null when no address is set', () => {
      expect(service.getSelectedShippingAddress()).toBeNull();
    });

    it('should return latest address when multiple addresses are set', () => {
      service.setSelectedShippingAddress(mockExistingAddressOption);
      service.setSelectedShippingAddress(mockNewAddressOption);
      
      expect(service.getSelectedShippingAddress()).toEqual(mockNewAddressOption);
    });
  });

  describe('Observable behavior', () => {
    it('should emit new values when address is set', (done) => {
      let emissionCount = 0;
      const expectedValues = [null, mockExistingAddressOption];

      service.shippingAddress$.subscribe(address => {
        expect(address).toEqual(expectedValues[emissionCount]);
        emissionCount++;
        
        if (emissionCount === expectedValues.length) {
          done();
        }
      });

      // This will trigger the second emission
      service.setSelectedShippingAddress(mockExistingAddressOption);
    });

    it('should emit multiple values in sequence', (done) => {
      let emissionCount = 0;
      const expectedValues = [null, mockExistingAddressOption, mockNewAddressOption, null];

      service.shippingAddress$.subscribe(address => {
        expect(address).toEqual(expectedValues[emissionCount]);
        emissionCount++;
        
        if (emissionCount === expectedValues.length) {
          done();
        }
      });

      // Trigger emissions
      service.setSelectedShippingAddress(mockExistingAddressOption);
      service.setSelectedShippingAddress(mockNewAddressOption);
      service.setSelectedShippingAddress(null);
    });    it('should allow multiple subscribers', (done) => {
      let subscriber1Count = 0;
      let subscriber2Count = 0;
      let subscriber1LastValue: ShippingAddressOption | null = null;
      let subscriber2LastValue: ShippingAddressOption | null = null;

      service.shippingAddress$.subscribe(address => {
        subscriber1Count++;
        subscriber1LastValue = address;
        checkCompletion();
      });

      service.shippingAddress$.subscribe(address => {
        subscriber2Count++;
        subscriber2LastValue = address;
        checkCompletion();
      });

      function checkCompletion() {
        if (subscriber1Count === 2 && subscriber2Count === 2) {
          expect(subscriber1LastValue).toEqual(mockExistingAddressOption);
          expect(subscriber2LastValue).toEqual(mockExistingAddressOption);
          expect(subscriber1Count).toBe(2);
          expect(subscriber2Count).toBe(2);
          done();
        }
      }

      service.setSelectedShippingAddress(mockExistingAddressOption);
    });

    it('should maintain state across different calls', () => {
      // Verify initial state
      expect(service.getSelectedShippingAddress()).toBeNull();

      // Set and verify existing address
      service.setSelectedShippingAddress(mockExistingAddressOption);
      expect(service.getSelectedShippingAddress()).toEqual(mockExistingAddressOption);

      // The observable should also reflect the current state
      service.shippingAddress$.subscribe(address => {
        expect(address).toEqual(mockExistingAddressOption);
      }).unsubscribe();

      // Set and verify new address
      service.setSelectedShippingAddress(mockNewAddressOption);
      expect(service.getSelectedShippingAddress()).toEqual(mockNewAddressOption);
    });
  });

  describe('Type safety and validation', () => {
    it('should handle existing address type correctly', () => {
      service.setSelectedShippingAddress(mockExistingAddressOption);
      const address = service.getSelectedShippingAddress();
      
      expect(address?.type).toBe('existing');      if (address?.type === 'existing') {
        expect(address.address.id).toBe(mockExistingAddress.id);
        expect(address.address.streetAddress).toBe(mockExistingAddress.streetAddress);
        expect(address.address.city.name).toBe(mockExistingAddress.city.name);
      }
    });

    it('should handle new address type correctly', () => {
      service.setSelectedShippingAddress(mockNewAddressOption);
      const address = service.getSelectedShippingAddress();
      
      expect(address?.type).toBe('new');      if (address?.type === 'new') {
        expect(address.addressData.streetAddress).toBe('New St 456');
        expect(address.addressData.recipientName).toBe('Jane Smith');
      }
    });

    it('should differentiate between address types', () => {
      // Set existing address
      service.setSelectedShippingAddress(mockExistingAddressOption);
      let address = service.getSelectedShippingAddress();
      expect(address?.type).toBe('existing');

      // Set new address
      service.setSelectedShippingAddress(mockNewAddressOption);
      address = service.getSelectedShippingAddress();
      expect(address?.type).toBe('new');
    });
  });

  describe('Service singleton behavior', () => {
    it('should maintain state across different service injections', () => {
      // Set address in current service instance
      service.setSelectedShippingAddress(mockExistingAddressOption);
      
      // Get new service instance (should be same due to providedIn: 'root')
      const newServiceInstance = TestBed.inject(CheckoutStateService);
      
      // Should have the same state
      expect(newServiceInstance.getSelectedShippingAddress()).toEqual(mockExistingAddressOption);
    });
  });

  describe('Edge cases', () => {
    it('should handle setting same address multiple times', () => {
      service.setSelectedShippingAddress(mockExistingAddressOption);
      service.setSelectedShippingAddress(mockExistingAddressOption);
      service.setSelectedShippingAddress(mockExistingAddressOption);
      
      expect(service.getSelectedShippingAddress()).toEqual(mockExistingAddressOption);
    });

    it('should handle rapid state changes', () => {
      service.setSelectedShippingAddress(mockExistingAddressOption);
      service.setSelectedShippingAddress(null);
      service.setSelectedShippingAddress(mockNewAddressOption);
      service.setSelectedShippingAddress(null);
      service.setSelectedShippingAddress(mockExistingAddressOption);
      
      expect(service.getSelectedShippingAddress()).toEqual(mockExistingAddressOption);
    });

    it('should handle empty new address data', () => {
      const emptyNewAddressOption: ShippingAddressOption = {
        type: 'new',
        addressData: {}
      };
      
      service.setSelectedShippingAddress(emptyNewAddressOption);
      const address = service.getSelectedShippingAddress();
      
      expect(address?.type).toBe('new');
      if (address?.type === 'new') {
        expect(address.addressData).toEqual({});
      }
    });
  });
});
