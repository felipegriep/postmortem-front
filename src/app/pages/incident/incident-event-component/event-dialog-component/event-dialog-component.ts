import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, NgForm } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EventTypeEnum } from '../../../../domain/enums/event-type-enum';
import { IncidentEventInterface } from '../../../../domain/interfaces/request/incident-event-interface';
import { IncidentEventResponseInterface } from '../../../../domain/interfaces/response/incident-event-response-interface';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCalendarDay, faXmark } from '@fortawesome/free-solid-svg-icons';
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt.js';
import 'flatpickr/dist/flatpickr.min.css';
import {
    DATE_PLACEHOLDER,
    FLATPICKR_ALT_FORMAT,
    FLATPICKR_VALUE_FORMAT,
} from '../../../../shared/date.constants';
import {
    normalizeToDate,
    toBackendDateTimeString,
    toLocalInputDateTime,
} from '../../../../shared/date-utils';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-event-dialog-component',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDialogModule,
        TextFieldModule,
        FontAwesomeModule,
    ],
    templateUrl: './event-dialog-component.html',
    styleUrls: ['./event-dialog-component.scss'],
})
export class EventDialogComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input() eventData?: IncidentEventResponseInterface | IncidentEventInterface;
    @Input() isEdit = false;
    @Input() incidentStartedAt?: string | Date;
    @Output() cancel = new EventEmitter<void>();
    @Output() submitEvent = new EventEmitter<IncidentEventInterface>();
    @ViewChild('eventAtInput', { static: false }) eventAtInput?: ElementRef<HTMLInputElement>;

    event: IncidentEventInterface;
    eventTypes = [
        { id: EventTypeEnum.ALERT, name: 'Alerta' },
        { id: EventTypeEnum.DIAGNOSIS, name: 'Diagnóstico' },
        { id: EventTypeEnum.MITIGATION, name: 'Mitigação' },
        { id: EventTypeEnum.FIX, name: 'Correção (Fix)' },
        { id: EventTypeEnum.COMMUNICATION, name: 'Comunicação' },
    ];
    public readonly xmark = faXmark;
    public readonly calendarDay = faCalendarDay;
    private eventAtPicker?: flatpickr.Instance;
    private incidentStartDate?: Date;
    readonly datePlaceholder = DATE_PLACEHOLDER;
    readonly flatpickrValueFormat = FLATPICKR_VALUE_FORMAT;
    readonly flatpickrAltFormat = FLATPICKR_ALT_FORMAT;
    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly faLibrary: FaIconLibrary,
        private readonly cdr: ChangeDetectorRef,
        private readonly dialog: MatDialog
    ) {
        this.event = this.buildDefaultEvent();

        try {
            this.faLibrary.addIcons(faXmark, faCalendarDay);
        } catch (e) {
            // noop - library unavailable
        }

        this.syncWithInputs();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['incidentStartedAt']) {
            this.updateIncidentStartDate();
        }
        if (changes['eventData'] || changes['isEdit']) {
            this.syncWithInputs();
        }
    }

    ngAfterViewInit(): void {
        this.initializeEventPicker();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        try {
            this.eventAtPicker?.destroy();
        } catch (e) {
            // noop
        } finally {
            this.eventAtPicker = undefined;
        }
    }

    onCancel(): void {
        if (this.isEdit) {
            this.dialog
                .open(ConfirmDialogComponent, {
                    width: '420px',
                    data: {
                        message: 'Deseja cancelar? As alterações não salvas serão perdidas.',
                    },
                    disableClose: true,
                })
                .afterClosed()
                .pipe(takeUntil(this.destroy$))
                .subscribe((confirmed) => {
                    if (confirmed) {
                        this.cancel.emit();
                    }
                });
            return;
        }
        this.cancel.emit();
    }

    onSubmit(form?: NgForm): void {
        if (!this.isFormValid() || form?.invalid) {
            form?.control.markAllAsTouched();
            return;
        }
        this.submitEvent.emit(this.serializeEvent());
    }

    openCalendar(): void {
        this.eventAtPicker?.open();
    }

    // Public method used by the template to return the event payload formatted for the backend
    serializeEvent(): IncidentEventInterface {
        const ev: IncidentEventInterface = { ...this.event } as IncidentEventInterface;
        ev.eventAt = toBackendDateTimeString(ev.eventAt) ?? ev.eventAt;
        return ev;
    }

    // Convert backend date string (e.g. 'yyyy-MM-dd HH:mm:ss') or ISO (yyyy-MM-ddTHH:mm:ssZ) to 'yyyy-MM-ddTHH:mm:ss' for the input
    private toInputFormat(input?: string | Date): string {
        return toLocalInputDateTime(input) ?? toLocalInputDateTime(new Date())!;
    }

    isFormValid(): boolean {
        return !!this.event.eventAt && !!this.event.type && !!this.event.description?.trim();
    }

    private syncWithInputs(): void {
        if (this.eventData) {
            this.event = { ...(this.eventData as IncidentEventInterface) };
            this.event.eventAt = this.toInputFormat(this.event.eventAt);
        } else {
            this.event = this.buildDefaultEvent();
        }

        if (this.eventAtPicker) {
            try {
                if (this.event?.eventAt) {
                    this.eventAtPicker.setDate(new Date(this.event.eventAt));
                } else {
                    this.eventAtPicker.clear();
                }
            } catch (e) {
                // ignore parse problems
            }
        }

        this.ensureEventAtRespectsIncidentStart();
    }

    private buildDefaultEvent(): IncidentEventInterface {
        return {
            eventAt: this.toInputFormat(),
            type: EventTypeEnum.ALERT,
            description: '',
        } as IncidentEventInterface;
    }

    private initializeEventPicker(): void {
        if (!this.eventAtInput) {
            return;
        }

        try {
            this.eventAtPicker?.destroy();
        } catch {}

        this.eventAtPicker = (flatpickr as any)(this.eventAtInput.nativeElement, {
            enableTime: true,
            time_24hr: true,
            dateFormat: this.flatpickrValueFormat,
            altInput: true,
            altFormat: this.flatpickrAltFormat,
            altInputClass: 'mat-mdc-input-element flatpickr-alt-input',
            locale: Portuguese,
            allowInput: true,
            clickOpens: true,
            defaultDate: this.event?.eventAt ? new Date(this.event.eventAt) : undefined,
            minDate: this.incidentStartDate ? new Date(this.incidentStartDate) : undefined,
            onReady: (_selectedDates: Date[], _dateStr: string, instance: any) => {
                try {
                    if (instance?.altInput) {
                        instance.altInput.setAttribute('placeholder', this.datePlaceholder);
                        instance.altInput.classList.add('mat-mdc-input-element');
                    }
                } catch (e) {
                    // no-op
                }
            },
            onChange: (selectedDates: Date[]) => {
                if (selectedDates && selectedDates[0]) {
                    this.event.eventAt =
                        toLocalInputDateTime(selectedDates[0]) ?? this.event.eventAt;
                    this.ensureEventAtRespectsIncidentStart();
                }
                this.cdr.detectChanges();
            },
            onClose: (selectedDates: Date[], dateStr: string, instance: any) => {
                try {
                    let dt: Date | null = null;
                    if (selectedDates && selectedDates[0]) {
                        dt = selectedDates[0];
                    } else if (dateStr) {
                        dt = (flatpickr as any).parseDate(
                            dateStr,
                            instance?.config?.altFormat || instance?.config?.dateFormat
                        );
                    }
                    if (dt) {
                        this.event.eventAt = toLocalInputDateTime(dt) ?? this.event.eventAt;
                        this.ensureEventAtRespectsIncidentStart();
                    }
                } catch (e) {
                    // ignore parse errors from manual input
                }
                this.cdr.detectChanges();
            },
        }) as flatpickr.Instance;
    }

    private updateIncidentStartDate(): void {
        this.incidentStartDate = normalizeToDate(this.incidentStartedAt) || undefined;
        if (this.eventAtPicker) {
            this.eventAtPicker.set('minDate', this.incidentStartDate ?? null);
        }
        this.ensureEventAtRespectsIncidentStart();
    }

    private ensureEventAtRespectsIncidentStart(): void {
        if (!this.incidentStartDate || !this.event) {
            return;
        }
        const currentDate = normalizeToDate(this.event.eventAt);
        if (currentDate && currentDate.getTime() >= this.incidentStartDate.getTime()) {
            return;
        }
        const adjusted = new Date(this.incidentStartDate);
        this.event.eventAt = toLocalInputDateTime(adjusted) ?? this.event.eventAt;
        if (this.eventAtPicker) {
            this.eventAtPicker.setDate(adjusted, false);
        }
    }
}
