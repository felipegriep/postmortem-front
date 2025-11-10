import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { ActionItemTabComponent } from './action-item-tab';
import { ActionItemService } from '../../../services/action-item-service';
import { ToastService } from '../../../shared/toast.service';
import { IncidentService } from '../../../services/incident-service';

describe('ActionItemTabComponent', () => {
    let component: ActionItemTabComponent;
    let fixture: ComponentFixture<ActionItemTabComponent>;

    beforeEach(async () => {
        const actionItemServiceMock = {
            list: jasmine.createSpy('list').and.returnValue(of({ content: [], totalElements: 0 })),
            create: jasmine.createSpy('create'),
            update: jasmine.createSpy('update'),
            delete: jasmine.createSpy('delete'),
        } as unknown as ActionItemService;

        const incidentServiceMock = {
            get: jasmine.createSpy('get').and.returnValue(
                of({
                    startedAt: new Date().toISOString(),
                })
            ),
        } as unknown as IncidentService;

        const toastServiceMock = jasmine.createSpyObj<ToastService>('ToastService', [
            'success',
            'error',
            'info',
            'warning',
            'show',
        ]);

        const dialogMock = {
            open: jasmine.createSpy('open').and.returnValue({
                afterClosed: () => of(undefined),
            }),
        } as unknown as MatDialog;

        const parentParamMap$ = of(convertToParamMap({ id: '1' }));
        const childParamMap$ = of(convertToParamMap({ id: '1' }));

        await TestBed.configureTestingModule({
            imports: [ActionItemTabComponent],
            providers: [
                { provide: ActionItemService, useValue: actionItemServiceMock },
                { provide: IncidentService, useValue: incidentServiceMock },
                { provide: ToastService, useValue: toastServiceMock },
                { provide: MatDialog, useValue: dialogMock },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        parent: {
                            snapshot: { paramMap: convertToParamMap({ id: '1' }) },
                            paramMap: parentParamMap$,
                        },
                        snapshot: { paramMap: convertToParamMap({}) },
                        paramMap: childParamMap$,
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ActionItemTabComponent);
        component = fixture.componentInstance;
        component.incidentId = 1;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
