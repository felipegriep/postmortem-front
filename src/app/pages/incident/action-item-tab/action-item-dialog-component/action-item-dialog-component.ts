import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnChanges,
    SimpleChanges,
    ViewChild,
    ElementRef,
    inject,
    Input,
    Output,
    EventEmitter,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCalendarDay, faXmark } from '@fortawesome/free-solid-svg-icons';
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt.js';
import 'flatpickr/dist/flatpickr.min.css';
import { ActionItemInterface } from '../../../../domain/interfaces/request/action-item-interface';
import { ActionItemResponseInterface } from '../../../../domain/interfaces/response/action-item-response-interface';
import { ActionStatusEnum } from '../../../../domain/enums/action-status-enum';
import { ActionTypeEnum } from '../../../../domain/enums/action-type-enum';
import { UserAccountResponseInterface } from '../../../../domain/interfaces/response/user-account-response-interface';
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

@Component({
    selector: 'app-action-item-dialog-component',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        TextFieldModule,
        FontAwesomeModule,
    ],
    templateUrl: './action-item-dialog-component.html',
    styleUrl: './action-item-dialog-component.scss',
})
export class ActionItemDialogComponent implements OnChanges, AfterViewInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    @ViewChild('dueDateInput', { static: false }) dueDateInput?: ElementRef<HTMLInputElement>;

    readonly form = this.fb.group({
        type: this.fb.control<ActionTypeEnum>(ActionTypeEnum.CORRECTIVE, {
            validators: [Validators.required],
        }),
        description: this.fb.control('', {
            validators: [Validators.required, Validators.maxLength(500)],
        }),
        ownerId: this.fb.control<number | null>(null, { validators: [Validators.required] }),
        dueDate: this.fb.control('', { validators: [Validators.required] }),
        status: this.fb.control<ActionStatusEnum>(ActionStatusEnum.TODO, {
            validators: [Validators.required],
        }),
        evidenceLink: this.fb.control('', { validators: [Validators.maxLength(2048)] }),
    });

    readonly typeOptions = Object.values(ActionTypeEnum);
    readonly statusOptions = Object.values(ActionStatusEnum);
    readonly calendarDay = faCalendarDay;
    readonly datePlaceholder = DATE_PLACEHOLDER;
    readonly flatpickrValueFormat = FLATPICKR_VALUE_FORMAT;
    readonly flatpickrAltFormat = FLATPICKR_ALT_FORMAT;
    readonly closeIcon = faXmark;

    private dueDatePicker?: flatpickr.Instance;

    private _owners: UserAccountResponseInterface[] = [];
    @Input() mode: 'create' | 'edit' = 'create';
    @Input() set action(value: ActionItemResponseInterface | null | undefined) {
        this._action = value ?? null;
    }
    get action(): ActionItemResponseInterface | null {
        return this._action;
    }
    @Input() set owners(value: UserAccountResponseInterface[] | null | undefined) {
        this._owners = value ?? [];
    }
    get owners(): UserAccountResponseInterface[] {
        return this._owners;
    }
    @Output() cancelled = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<ActionItemInterface>();

    private _action: ActionItemResponseInterface | null = null;

    constructor(private readonly faLibrary: FaIconLibrary) {
        try {
            this.faLibrary.addIcons(faCalendarDay, faXmark);
        } catch (e) {
            // ignore icon registration issues (tests, etc.)
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['action'] || changes['mode']) {
            this.patchFormFromInputs();
            this.syncPickerWithForm();
        }
    }

    ngAfterViewInit(): void {
        this.initializeDueDatePicker();
        this.syncPickerWithForm();
    }

    ngOnDestroy(): void {
        try {
            this.dueDatePicker?.destroy();
        } catch {}
        this.dueDatePicker = undefined;
    }

    getTypeLabel(type: ActionTypeEnum): string {
        return type === ActionTypeEnum.CORRECTIVE ? 'Corretiva' : 'Preventiva';
    }

    getStatusLabel(status: ActionStatusEnum): string {
        const labels: Record<ActionStatusEnum, string> = {
            TODO: 'A fazer',
            DOING: 'Em andamento',
            DONE: 'Concluída',
        };
        return labels[status];
    }

    openCalendar(): void {
        this.dueDatePicker?.open();
    }

    cancel(): void {
        this.cancelled.emit();
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();
        const dueDateBackend = toBackendDateTimeString(raw.dueDate) ?? raw.dueDate ?? '';
        const statusControlValue = raw.status ?? ActionStatusEnum.TODO;
        const status = this.mode === 'create' ? ActionStatusEnum.TODO : statusControlValue;

        const actionItem: ActionItemInterface = {
            type: raw.type!,
            description: raw.description!.trim(),
            ownerId: Number(raw.ownerId!),
            dueDate: dueDateBackend,
            status,
            evidenceLink: raw.evidenceLink?.trim() ? raw.evidenceLink.trim() : null,
        };

        this.submitted.emit(actionItem);
    }

    private patchFormFromInputs(): void {
        const sourceDate = this.action?.dueDate ?? new Date();
        const normalized = normalizeToDate(sourceDate) ?? new Date();
        const inputValue = toLocalInputDateTime(normalized) ?? toLocalInputDateTime(new Date())!;

        this.form.reset(
            {
                type: this.action?.type ?? ActionTypeEnum.CORRECTIVE,
                description: this.action?.description ?? '',
                ownerId: this.action?.owner?.id ?? null,
                dueDate: inputValue,
                status: this.action?.status ?? ActionStatusEnum.TODO,
                evidenceLink: this.action?.evidenceLink ?? '',
            },
            { emitEvent: false }
        );

        if (this.mode === 'create') {
            this.form.get('status')?.disable({ emitEvent: false });
            this.form.patchValue({ status: ActionStatusEnum.TODO }, { emitEvent: false });
        } else {
            this.form.get('status')?.enable({ emitEvent: false });
        }
    }

    private initializeDueDatePicker(): void {
        if (!this.dueDateInput) {
            return;
        }

        try {
            this.dueDatePicker?.destroy();
        } catch {}

        const defaultDate = normalizeToDate(this.form.get('dueDate')?.value ?? null) ?? new Date();

        this.dueDatePicker = (flatpickr as any)(this.dueDateInput.nativeElement, {
            enableTime: true,
            time_24hr: true,
            dateFormat: this.flatpickrValueFormat,
            altInput: true,
            altFormat: this.flatpickrAltFormat,
            altInputClass: 'mat-mdc-input-element flatpickr-alt-input',
            locale: Portuguese,
            allowInput: true,
            clickOpens: true,
            defaultDate,
            onChange: (selectedDates: Date[], dateStr: string) => {
                const selected = selectedDates?.[0] ?? normalizeToDate(dateStr);
                const iso = toLocalInputDateTime(selected) ?? '';
                this.form.patchValue({ dueDate: iso }, { emitEvent: false });
            },
            onClose: (selectedDates: Date[], dateStr: string) => {
                const selected = selectedDates?.[0] ?? normalizeToDate(dateStr);
                const iso = toLocalInputDateTime(selected) ?? '';
                this.form.patchValue({ dueDate: iso }, { emitEvent: false });
            },
        });
    }

    private syncPickerWithForm(): void {
        if (!this.dueDatePicker) {
            return;
        }
        const current = normalizeToDate(this.form.get('dueDate')?.value ?? null);
        try {
            if (current) {
                this.dueDatePicker.setDate(current, false);
            } else {
                this.dueDatePicker.clear();
            }
        } catch {}
    }
}
