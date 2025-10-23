import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentEventComponent } from './incident-event-component';

describe('IncidentEventComponent', () => {
    let component: IncidentEventComponent;
    let fixture: ComponentFixture<IncidentEventComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IncidentEventComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(IncidentEventComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
