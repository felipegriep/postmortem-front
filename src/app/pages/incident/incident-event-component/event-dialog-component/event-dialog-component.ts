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
import { EventTypeEnum } from '../../../../domain/enums/event-type-enum';
import { IncidentEventInterface } from '../../../../domain/interfaces/request/incident-event-interface';
import { IncidentEventResponseInterface } from '../../../../domain/interfaces/response/incident-event-response-interface';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCalendarDay, faXmark } from '@fortawesome/free-solid-svg-icons';
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt.js';
import 'flatpickr/dist/flatpickr.min.css';

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

    constructor(
        private readonly faLibrary: FaIconLibrary,
        private readonly cdr: ChangeDetectorRef
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
        try {
            this.eventAtPicker?.destroy();
        } catch (e) {
            // noop
        } finally {
            this.eventAtPicker = undefined;
        }
    }

    onCancel(): void {
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
        ev.eventAt = this.formatForBackend(ev.eventAt);
        return ev;
    }

    // Convert 'datetime-local' input value (yyyy-MM-ddTHH:mm:ss) to backend format 'yyyy-MM-dd HH:mm:ss'
    private formatForBackend(input?: string): string {
        if (!input) return input as string;
        let dt = input;
        // If input uses 'T' separator (datetime-local), replace with space
        if (dt.includes('T')) dt = dt.replace('T', ' ');
        // Ensure seconds are present
        if (!/\d{2}:\d{2}:\d{2}$/.test(dt)) {
            // append missing seconds when value ends with 'HH:mm'
            dt = dt + ':00';
        }
        return dt;
    }

    // Convert backend date string (e.g. 'yyyy-MM-dd HH:mm:ss') or ISO (yyyy-MM-ddTHH:mm:ssZ) to 'yyyy-MM-ddTHH:mm:ss' for the input
    private toInputFormat(input?: string): string {
        if (!input) {
            // default to current local datetime in format yyyy-MM-ddTHH:mm:ss
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const yyyy = now.getFullYear();
            const mm = pad(now.getMonth() + 1);
            const dd = pad(now.getDate());
            const hh = pad(now.getHours());
            const min = pad(now.getMinutes());
            const ss = pad(now.getSeconds());
            return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
        }
        let dt = input.trim();
        // If backend format 'yyyy-MM-dd HH:mm:ss', replace space with 'T'
        if (dt.includes(' ')) {
            dt = dt.replace(' ', 'T');
        }
        // If it has seconds or timezone, normalize by slicing the first 19 characters 'yyyy-MM-ddTHH:mm:ss'
        if (dt.length >= 19) {
            return dt.slice(0, 19);
        }
        return dt;
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
            dateFormat: 'Y-m-d\\TH:i:S',
            altInput: true,
            altFormat: 'd/m/Y H:i:S',
            altInputClass: 'mat-mdc-input-element flatpickr-alt-input',
            locale: Portuguese,
            allowInput: true,
            clickOpens: true,
            defaultDate: this.event?.eventAt ? new Date(this.event.eventAt) : undefined,
            minDate: this.incidentStartDate ? new Date(this.incidentStartDate) : undefined,
            onReady: (_selectedDates: Date[], _dateStr: string, instance: any) => {
                try {
                    if (instance?.altInput) {
                        instance.altInput.setAttribute('placeholder', 'DD/MM/YYYY HH:mm:ss');
                        instance.altInput.classList.add('mat-mdc-input-element');
                    }
                } catch (e) {
                    // no-op
                }
            },
            onChange: (selectedDates: Date[]) => {
                if (selectedDates && selectedDates[0]) {
                    this.event.eventAt = this.toLocalDatetimeInputValue(selectedDates[0]);
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
                        this.event.eventAt = this.toLocalDatetimeInputValue(dt);
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
        this.incidentStartDate = this.parseToDate(this.incidentStartedAt) || undefined;
        if (this.eventAtPicker) {
            this.eventAtPicker.set('minDate', this.incidentStartDate ?? null);
        }
        this.ensureEventAtRespectsIncidentStart();
    }

    private ensureEventAtRespectsIncidentStart(): void {
        if (!this.incidentStartDate || !this.event) {
            return;
        }
        const currentDate = this.parseToDate(this.event.eventAt);
        if (currentDate && currentDate.getTime() >= this.incidentStartDate.getTime()) {
            return;
        }
        const adjusted = new Date(this.incidentStartDate);
        this.event.eventAt = this.toLocalDatetimeInputValue(adjusted);
        if (this.eventAtPicker) {
            this.eventAtPicker.setDate(adjusted, false);
        }
    }

    private toLocalDatetimeInputValue(date: Date): string {
        if (!date) return '';
        const copy = new Date(date);
        if (isNaN(copy.getTime())) {
            return '';
        }
        const pad = (n: number) => n.toString().padStart(2, '0');
        const yyyy = copy.getFullYear();
        const mm = pad(copy.getMonth() + 1);
        const dd = pad(copy.getDate());
        const hh = pad(copy.getHours());
        const min = pad(copy.getMinutes());
        const ss = pad(copy.getSeconds());
        return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    }

    private parseToDate(value?: string | Date | null): Date | null {
        if (!value) {
            return null;
        }
        if (value instanceof Date) {
            return isNaN(value.getTime()) ? null : new Date(value.getTime());
        }
        const stringValue =
            typeof value === 'string'
                ? value.trim()
                : typeof value === 'number'
                ? String(value)
                : `${value}`;
        const normalized =
            stringValue.includes(' ') && !stringValue.includes('T')
                ? stringValue.replace(' ', 'T')
                : stringValue;
        const parsed = new Date(normalized);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
}
