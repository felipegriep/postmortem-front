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
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
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
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

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
        MatAutocompleteModule,
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
        owner: this.fb.control<UserAccountResponseInterface | string | null>(null),
        ownerId: this.fb.control<number | null>(null),
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
    readonly ownerControl = this.form.get('owner') as FormControl<
        UserAccountResponseInterface | string | null
    >;
    readonly ownerIdControl = this.form.get('ownerId') as FormControl<number | null>;
    readonly filteredOwners$: Observable<UserAccountResponseInterface[]>;

    private dueDatePicker?: flatpickr.Instance;
    private readonly destroy$ = new Subject<void>();

    private _owners: UserAccountResponseInterface[] = [];
    @Input() mode: 'create' | 'edit' = 'create';
    @Input() set action(value: ActionItemResponseInterface | null | undefined) {
        this._action = value ?? null;
    }
    get action(): ActionItemResponseInterface | null {
        return this._action;
    }
    @Input() set owners(value: UserAccountResponseInterface[] | null | undefined) {
        this._owners = (value ?? []).slice();
        this.syncOwnerControls();
        this.emitOwnerFilterRefresh();
    }
    get owners(): UserAccountResponseInterface[] {
        return this._owners;
    }
    @Input() incidentStartedAt: Date | string | null = null;
    @Input() resetToken = 0;
    @Output() cancelled = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<ActionItemInterface>();

    private _action: ActionItemResponseInterface | null = null;

    constructor(
        private readonly faLibrary: FaIconLibrary,
        private readonly dialog: MatDialog
    ) {
        try {
            this.faLibrary.addIcons(faCalendarDay, faXmark);
        } catch (e) {
            // ignore icon registration issues (tests, etc.)
        }

        this.filteredOwners$ = this.ownerControl.valueChanges.pipe(
            startWith(this.ownerControl.value),
            map((value) => this.ownerQueryFromValue(value)),
            map((query) => this.filterOwners(query))
        );

        this.ownerControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
            if (value && typeof value !== 'string') {
                this.ownerIdControl.setValue(value.id, { emitEvent: false });
                this.ownerIdControl.updateValueAndValidity({ emitEvent: false });
            } else if (typeof value === 'string') {
                this.ownerIdControl.setValue(null, { emitEvent: false });
                this.ownerIdControl.updateValueAndValidity({ emitEvent: false });
            } else if (!value) {
                this.ownerIdControl.setValue(null, { emitEvent: false });
                this.ownerIdControl.updateValueAndValidity({ emitEvent: false });
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['action'] || changes['mode'] || changes['resetToken']) {
            this.patchFormFromInputs();
            this.syncPickerWithForm();
        }
        if (changes['incidentStartedAt']) {
            this.ensureDueDateRespectsMin();
        }
    }

    ngAfterViewInit(): void {
        this.initializeDueDatePicker();
        this.syncPickerWithForm();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
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
        const minDate = this.computeMinDueDate();
        this.dueDatePicker?.set('minDate', minDate);
        this.dueDatePicker?.open();
    }

    cancel(): void {
        if (this.mode === 'edit') {
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
                        this.cancelled.emit();
                    }
                });
            return;
        }
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
        const resolvedOwnerId = this.resolveOwnerId(raw.owner ?? null, raw.ownerId ?? null);

        if (!resolvedOwnerId) {
            if (this._owners.length) {
                this.ownerControl.markAsTouched();
                this.ownerControl.updateValueAndValidity();
            } else {
                this.ownerIdControl.markAsTouched();
                this.ownerIdControl.updateValueAndValidity();
            }
            this.form.markAllAsTouched();
            return;
        }

        const actionItem: ActionItemInterface = {
            type: raw.type!,
            description: raw.description?.trim() ?? '',
            ownerId: Number(resolvedOwnerId),
            dueDate: dueDateBackend,
            status,
            evidenceLink: raw.evidenceLink?.trim() ? raw.evidenceLink.trim() : null,
        };

        this.submitted.emit(actionItem);
    }

    private patchFormFromInputs(): void {
        const initialDueDate = this.computeInitialDueDate();
        const ownerFromAction = this.findOwnerById(this.action?.owner?.id ?? null);
        const ownerId = ownerFromAction?.id ?? this.action?.owner?.id ?? null;
        const inputValue = toLocalInputDateTime(initialDueDate) ?? '';

        this.form.reset(
            {
                type: this.action?.type ?? ActionTypeEnum.CORRECTIVE,
                description: this.action?.description ?? '',
                owner: ownerFromAction,
                ownerId,
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

        this.syncOwnerControls();
        this.emitOwnerFilterRefresh();
    }

    private initializeDueDatePicker(): void {
        if (!this.dueDateInput) {
            return;
        }

        try {
            this.dueDatePicker?.destroy();
        } catch {}

        const minDate = this.computeMinDueDate();
        const rawDate = normalizeToDate(this.form.get('dueDate')?.value ?? null);
        const defaultDate = this.clampToMin(rawDate ?? minDate);
        if (!rawDate || rawDate < minDate) {
            this.form.patchValue(
                { dueDate: toLocalInputDateTime(defaultDate) ?? '' },
                { emitEvent: false }
            );
        }

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
            minDate,
            defaultDate,
            onChange: (selectedDates: Date[], dateStr: string) => {
                const selected = selectedDates?.[0] ?? normalizeToDate(dateStr);
                const clamped = this.clampToMin(selected ?? minDate);
                const iso = toLocalInputDateTime(clamped) ?? '';
                this.form.patchValue({ dueDate: iso }, { emitEvent: false });
            },
            onClose: (selectedDates: Date[], dateStr: string) => {
                const selected = selectedDates?.[0] ?? normalizeToDate(dateStr);
                const clamped = this.clampToMin(selected ?? minDate);
                const iso = toLocalInputDateTime(clamped) ?? '';
                this.form.patchValue({ dueDate: iso }, { emitEvent: false });
            },
            onOpen: () => {
                this.dueDatePicker?.set('minDate', this.computeMinDueDate());
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

    private syncOwnerControls(): void {
        const ownerCtrl = this.ownerControl;
        const ownerIdCtrl = this.ownerIdControl;
        const currentOwner = ownerCtrl.value;
        const fallbackOwnerId = ownerIdCtrl.value ?? this.action?.owner?.id ?? null;

        if (this._owners.length) {
            ownerCtrl.setValidators([Validators.required]);
            ownerCtrl.updateValueAndValidity({ emitEvent: false });

            ownerIdCtrl.clearValidators();
            ownerIdCtrl.updateValueAndValidity({ emitEvent: false });

            const matchedOwner =
                (currentOwner && typeof currentOwner !== 'string'
                    ? currentOwner
                    : this.findOwnerById(fallbackOwnerId)) ?? null;
            if (matchedOwner) {
                ownerCtrl.setValue(matchedOwner, { emitEvent: false });
                ownerIdCtrl.setValue(matchedOwner.id ?? null, { emitEvent: false });
            } else {
                ownerIdCtrl.setValue(null, { emitEvent: false });
            }
        } else {
            ownerCtrl.clearValidators();
            ownerCtrl.setValue(null, { emitEvent: false });
            ownerCtrl.updateValueAndValidity({ emitEvent: false });

            ownerIdCtrl.setValidators([Validators.required]);
            ownerIdCtrl.setValue(fallbackOwnerId, { emitEvent: false });
            ownerIdCtrl.updateValueAndValidity({ emitEvent: false });
        }
    }

    private emitOwnerFilterRefresh(): void {
        if (!this._owners.length) {
            return;
        }
        this.ownerControl.setValue(this.ownerControl.value, { emitEvent: true });
    }

    private ownerQueryFromValue(
        value: UserAccountResponseInterface | string | null | undefined
    ): string {
        if (!value) {
            return '';
        }
        if (typeof value === 'string') {
            return value;
        }
        return this.displayOwner(value);
    }

    private filterOwners(query: string): UserAccountResponseInterface[] {
        if (!this._owners.length) {
            return [];
        }
        const normalized = query?.toLocaleLowerCase?.() ?? '';
        if (!normalized) {
            return this._owners.slice(0, 50);
        }
        return this._owners
            .filter((owner) => {
                const name = owner.name?.toLocaleLowerCase?.() ?? '';
                const email = owner.email?.toLocaleLowerCase?.() ?? '';
                return name.includes(normalized) || email.includes(normalized);
            })
            .slice(0, 50);
    }

    readonly displayOwner = (
        owner: UserAccountResponseInterface | string | null | undefined
    ): string => {
        if (!owner) {
            return '';
        }
        if (typeof owner === 'string') {
            return owner;
        }
        const segments = [owner.name, owner.email].filter(Boolean);
        return segments.join(' · ');
    };

    onOwnerOptionSelected(owner: UserAccountResponseInterface): void {
        this.ownerControl.setValue(owner, { emitEvent: true });
        this.ownerControl.markAsDirty();
    }

    private findOwnerById(id: number | null | undefined): UserAccountResponseInterface | null {
        if (id === null || id === undefined) {
            return null;
        }
        return this._owners.find((owner) => owner.id === id) ?? null;
    }

    private computeInitialDueDate(): Date {
        const source = normalizeToDate(this.action?.dueDate ?? null) ?? new Date();
        return this.clampToMin(source);
    }

    private computeMinDueDate(): Date {
        const incidentStart = normalizeToDate(this.incidentStartedAt ?? null);
        const base = incidentStart ?? new Date();
        return new Date(base.getTime() + 15 * 60 * 1000);
    }

    private clampToMin(date: Date): Date {
        const minDate = this.computeMinDueDate();
        return date < minDate ? minDate : date;
    }

    private ensureDueDateRespectsMin(): void {
        const minDate = this.computeMinDueDate();
        const current = normalizeToDate(this.form.get('dueDate')?.value ?? null);
        const clamped = this.clampToMin(current ?? minDate);

        if (!current || current < minDate) {
            this.form.patchValue(
                { dueDate: toLocalInputDateTime(clamped) ?? '' },
                { emitEvent: false }
            );
        }

        if (this.dueDatePicker) {
            this.dueDatePicker.set('minDate', minDate);
            try {
                this.dueDatePicker.setDate(clamped, false);
            } catch {}
        }
    }

    private resolveOwnerId(
        owner: UserAccountResponseInterface | string | null,
        ownerId: number | null
    ): number | null {
        if (this._owners.length) {
            return typeof owner === 'object' && owner ? owner.id ?? null : null;
        }
        if (ownerId === null || ownerId === undefined) {
            return null;
        }
        const parsed = Number(ownerId);
        return Number.isNaN(parsed) ? null : parsed;
    }
}
