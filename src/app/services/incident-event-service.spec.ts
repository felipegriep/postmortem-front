import { TestBed } from '@angular/core/testing';

import { IncidentEventService } from './incident-event-service';

describe('IncidentEventService', () => {
    let service: IncidentEventService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(IncidentEventService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
