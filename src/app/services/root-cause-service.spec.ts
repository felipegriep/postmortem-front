import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RootCauseService } from './root-cause-service';

describe('RootCauseService', () => {
    let service: RootCauseService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(RootCauseService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
