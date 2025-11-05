import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionItemDialogComponent } from './action-item-dialog-component';

describe('ActionItemDialogComponent', () => {
    let component: ActionItemDialogComponent;
    let fixture: ComponentFixture<ActionItemDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ActionItemDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ActionItemDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
