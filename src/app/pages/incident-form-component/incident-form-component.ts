import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IncidentService } from '../../services/incident-service';
import { IncidentInterface } from '../../domain/interfaces/request/incident-interface';
import { SeverityEnum } from '../../domain/enums/severity-enum';
import { StatusEnum } from '../../domain/enums/status-enum';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt.js';
import 'flatpickr/dist/flatpickr.min.css';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import { Subject, of, switchMap, takeUntil } from 'rxjs';

@Component({
    selector: 'app-incident-form-component',
    imports: [
        CommonModule,
        NgIf,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        FontAwesomeModule,
    ],
    templateUrl: './incident-form-component.html',
    styleUrls: ['./incident-form-component.scss'],
})
export class IncidentFormComponent implements OnInit, AfterViewInit, OnDestroy {
    incident: IncidentInterface = this.getEmptyIncident();
    isEditMode = false;
    public readonly calendarDay = faCalendarDay;

    @ViewChild('startedAtInput', { static: false }) startedAtInput?: ElementRef<HTMLInputElement>;
    @ViewChild('endedAtInput', { static: false }) endedAtInput?: ElementRef<HTMLInputElement>;
    @ViewChild('incidentForm', { static: false }) incidentForm?: NgForm;

    private startedFp: any = null;
    private endedFp: any = null;
    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private incidentService: IncidentService,
        private cdr: ChangeDetectorRef,
        private readonly faLibrary: FaIconLibrary
    ) {
        try {
            this.faLibrary.addIcons(faCalendarDay);
        } catch (e) {
            // noop - biblioteca pode não estar disponível em testes
        }
    }

    ngOnInit(): void {
        // ensure Material theme is loaded when this lazy component initializes
        this.loadMaterialTheme();
        const paramSource$ = this.route.parent?.paramMap ?? this.route.paramMap;

        paramSource$
            .pipe(
                takeUntil(this.destroy$),
                switchMap((params) => {
                    const idParam = params.get('id');
                    const parsedId = idParam != null ? Number(idParam) : NaN;
                    if (!idParam || Number.isNaN(parsedId)) {
                        this.isEditMode = false;
                        this.incident = this.getEmptyIncident();
                        this.resetPickers();
                        return of(null);
                    }
                    this.isEditMode = true;
                    return this.incidentService.get(parsedId);
                })
            )
            .subscribe((incident) => {
                if (!incident) {
                    return;
                }
                // Mapear IncidentResponseInterface -> IncidentInterface para o formulário
                this.incident = {
                    id: incident.id ? Number(incident.id) : undefined,
                    title: incident.title,
                    service: incident.service,
                    severity: incident.severity,
                    status: incident.status,
                    startedAt:
                        this.formatForInput(incident.startedAt) ||
                        this.toLocalDatetimeInputValue(new Date())!,
                    endedAt: this.toLocalDatetimeInputValue(incident.endedAt) || '',
                    impactShort: incident.impactShort,
                };
                this.syncPickersWithModel();
                this.configureEndedMinDate();
                this.cdr.detectChanges();
            });
    }

    private resetPickers(): void {
        try {
            if (this.startedFp) {
                this.startedFp.clear();
            }
        } catch {}
        try {
            if (this.endedFp) {
                this.endedFp.clear();
                this.endedFp.set('minDate', null);
            }
        } catch {}
    }

    ngAfterViewInit(): void {
        // initialize flatpickr on the inputs (if available)
        try {
            if (this.startedAtInput?.nativeElement) {
                this.startedFp = (flatpickr as any)(this.startedAtInput.nativeElement, {
                    enableTime: true,
                    time_24hr: true,
                    // internal value format (ISO-like), altInput displays BR format to the user
                    dateFormat: 'Y-m-d H:i',
                    altInput: true,
                    altFormat: 'd/m/Y H:i',
                    altInputClass: 'mat-mdc-input-element flatpickr-alt-input',
                    locale: Portuguese,
                    defaultDate: this.incident?.startedAt
                        ? new Date(this.incident.startedAt)
                        : undefined,
                    allowInput: true,
                    clickOpens: true,
                    onReady: (selectedDates: Date[], dateStr: string, instance: any) => {
                        try {
                            if (instance && instance.altInput) {
                                instance.altInput.setAttribute('placeholder', 'DD/MM/YYYY HH:mm');
                                // ensure it has our visual class
                                instance.altInput.classList.add(
                                    'mat-mdc-input-element',
                                    'flatpickr-alt-input'
                                );
                            }
                        } catch {}
                    },
                    onChange: (selectedDates: Date[]) => {
                        if (selectedDates && selectedDates[0]) {
                            // store model in the ISO local-like format expected elsewhere
                            this.incident.startedAt =
                                this.toLocalDatetimeInputValue(selectedDates[0]) || '';
                            // clear parse error on successful selection
                            this.setParseError('startedAt', false);

                            // set minDate on ended picker so user can't pick an earlier end date
                            try {
                                if (this.endedFp) {
                                    this.endedFp.set('minDate', selectedDates[0]);
                                    // if there's an existing ended date earlier than new start, clear it
                                    if (
                                        this.endedFp.selectedDates &&
                                        this.endedFp.selectedDates[0]
                                    ) {
                                        const endedMs = this.endedFp.selectedDates[0].getTime();
                                        if (endedMs < selectedDates[0].getTime()) {
                                            this.endedFp.clear();
                                            this.incident.endedAt = '';
                                            this.setParseError('endedAt', false);
                                        }
                                    }
                                }
                            } catch (e) {
                                // ignore
                            }
                        }
                        // update validation state
                        this.updateRangeValidation();
                        this.cdr.detectChanges();
                    },
                    onClose: (selectedDates: Date[], dateStr: string, instance: any) => {
                        try {
                            let dt: Date | null = null;
                            if (selectedDates && selectedDates[0]) dt = selectedDates[0];
                            else if (dateStr)
                                dt = (flatpickr as any).parseDate(
                                    dateStr,
                                    instance.config.altFormat || instance.config.dateFormat
                                );
                            if (dt) {
                                this.incident.startedAt = this.toLocalDatetimeInputValue(dt) || '';
                                this.setParseError('startedAt', false);
                                // update minDate on ended picker
                                if (this.endedFp) {
                                    this.endedFp.set('minDate', dt);
                                    if (
                                        this.endedFp.selectedDates &&
                                        this.endedFp.selectedDates[0]
                                    ) {
                                        const endedMs = this.endedFp.selectedDates[0].getTime();
                                        if (endedMs < dt.getTime()) {
                                            this.endedFp.clear();
                                            this.incident.endedAt = '';
                                            this.setParseError('endedAt', false);
                                        }
                                    }
                                }
                            } else {
                                // parse failed
                                this.setParseError('startedAt', true);
                            }
                            this.updateRangeValidation();
                            this.cdr.detectChanges();
                        } catch (e) {
                            // ignore parse errors
                            this.setParseError('startedAt', true);
                        }
                    },
                });
            }

            if (this.endedAtInput?.nativeElement) {
                this.endedFp = (flatpickr as any)(this.endedAtInput.nativeElement, {
                    enableTime: true,
                    time_24hr: true,
                    dateFormat: 'Y-m-d H:i',
                    altInput: true,
                    altFormat: 'd/m/Y H:i',
                    altInputClass: 'mat-mdc-input-element flatpickr-alt-input',
                    locale: Portuguese,
                    defaultDate: this.incident?.endedAt
                        ? new Date(this.incident.endedAt)
                        : undefined,
                    // set minDate initially from incident.startedAt if available
                    minDate: this.incident?.startedAt
                        ? new Date(this.incident.startedAt)
                        : undefined,
                    allowInput: true,
                    clickOpens: true,
                    onReady: (selectedDates: Date[], dateStr: string, instance: any) => {
                        try {
                            if (instance && instance.altInput) {
                                instance.altInput.setAttribute('placeholder', 'DD/MM/YYYY HH:mm');
                                instance.altInput.classList.add(
                                    'mat-mdc-input-element',
                                    'flatpickr-alt-input'
                                );
                            }
                        } catch {}
                    },
                    onChange: (selectedDates: Date[]) => {
                        if (selectedDates && selectedDates[0]) {
                            this.incident.endedAt =
                                this.toLocalDatetimeInputValue(selectedDates[0]) || '';
                            this.setParseError('endedAt', false);
                        } else {
                            this.incident.endedAt = '';
                        }
                        // update validation state
                        this.updateRangeValidation();
                        this.cdr.detectChanges();
                    },
                    onClose: (selectedDates: Date[], dateStr: string, instance: any) => {
                        try {
                            let dt: Date | null = null;
                            if (selectedDates && selectedDates[0]) dt = selectedDates[0];
                            else if (dateStr)
                                dt = (flatpickr as any).parseDate(
                                    dateStr,
                                    instance.config.altFormat || instance.config.dateFormat
                                );
                            if (dt) {
                                this.incident.endedAt = this.toLocalDatetimeInputValue(dt) || '';
                                this.setParseError('endedAt', false);
                            } else {
                                this.incident.endedAt = '';
                                this.setParseError('endedAt', false);
                            }
                            this.updateRangeValidation();
                            this.cdr.detectChanges();
                        } catch (e) {
                            // ignore parse errors
                            this.setParseError('endedAt', true);
                        }
                    },
                });
            }

            // After both pickers are created, ensure ended picker's constraints are synchronized
            this.configureEndedMinDate();
        } catch (e) {
            // fallback: leave inputs as-is if flatpickr fails
            console.warn('flatpickr initialization failed', e);
        }

        this.syncPickersWithModel();
    }

    // helper to set or clear parse error on a form field (template-driven NgModel)
    private setParseError(fieldName: string, hasError: boolean) {
        try {
            const form = this.incidentForm as any as NgForm | undefined;
            if (!form || !form.controls) return;
            const ngModel = (form.controls as any)[fieldName];
            const control = ngModel && ngModel.control ? ngModel.control : null;
            if (!control) return;
            if (hasError) {
                const errs = Object.assign({}, control.errors || {});
                errs.parse = true;
                control.setErrors(errs);
                try {
                    // ensure the control shows validation state
                    if (typeof control.markAsTouched === 'function') control.markAsTouched();
                } catch {}
            } else {
                const errs = Object.assign({}, control.errors || {});
                if (errs.parse) delete errs.parse;
                if (Object.keys(errs).length === 0) control.setErrors(null);
                else control.setErrors(errs);
            }
        } catch (e) {
            // ignore
        }
    }

    // helper to set or clear a range error (ended earlier than started)
    private setRangeError(fieldName: string, hasError: boolean) {
        try {
            const form = this.incidentForm as any as NgForm | undefined;
            if (!form || !form.controls) return;
            const ngModel = (form.controls as any)[fieldName];
            const control = ngModel && ngModel.control ? ngModel.control : null;
            if (!control) return;
            if (hasError) {
                const errs = Object.assign({}, control.errors || {});
                errs.range = true;
                control.setErrors(errs);
            } else {
                const errs = Object.assign({}, control.errors || {});
                if (errs.range) delete errs.range;
                if (Object.keys(errs).length === 0) control.setErrors(null);
                else control.setErrors(errs);
            }
        } catch (e) {
            // ignore
        }
    }

    // update range validation state based on current model values
    private updateRangeValidation() {
        try {
            const s = this.incident.startedAt ? new Date(this.incident.startedAt) : null;
            const e = this.incident.endedAt ? new Date(this.incident.endedAt) : null;
            if (!s || !e) {
                // no range to validate -> clear
                this.setRangeError('endedAt', false);
                return;
            }
            if (e.getTime() < s.getTime()) {
                this.setRangeError('endedAt', true);
            } else {
                this.setRangeError('endedAt', false);
            }
        } catch (e) {
            // ignore
        }
    }

    ngOnDestroy(): void {
        try {
            if (this.startedFp) {
                this.startedFp.destroy();
                this.startedFp = null;
            }
        } catch {}
        try {
            if (this.endedFp) {
                this.endedFp.destroy();
                this.endedFp = null;
            }
        } catch {}

        this.destroy$.next();
        this.destroy$.complete();
    }

    private syncPickersWithModel(): void {
        try {
            if (this.startedFp) {
                const startDate = this.parseToDate(this.incident.startedAt);
                if (startDate) this.startedFp.setDate(startDate, true);
                else this.startedFp.clear();
            }
            if (this.endedFp) {
                const endDate = this.parseToDate(this.incident.endedAt);
                if (endDate) this.endedFp.setDate(endDate, true);
                else this.endedFp.clear();
            }
        } catch (e) {
            // ignore sync errors
        }
    }

    private configureEndedMinDate(): void {
        try {
            if (!this.startedFp || !this.endedFp) {
                return;
            }
            const startDate = this.parseToDate(this.incident.startedAt);
            if (!startDate) {
                this.endedFp.set('minDate', null);
                this.updateRangeValidation();
                return;
            }
            this.endedFp.set('minDate', startDate);
            const selected = this.endedFp.selectedDates?.[0] ?? null;
            if (selected && selected.getTime() < startDate.getTime()) {
                this.endedFp.clear();
                this.incident.endedAt = '';
                this.setParseError('endedAt', false);
            }
            this.updateRangeValidation();
        } catch (e) {
            // ignore min-date sync issues
        }
    }

    // Open calendar manually (used by calendar buttons)
    openCalendar(which: 'started' | 'ended') {
        try {
            if (which === 'started' && this.startedFp) {
                // open flatpickr instance
                if (typeof this.startedFp.open === 'function') this.startedFp.open();
                else if (this.startedAtInput && this.startedAtInput.nativeElement)
                    this.startedAtInput.nativeElement.focus();
            }
            if (which === 'ended' && this.endedFp) {
                if (typeof this.endedFp.open === 'function') this.endedFp.open();
                else if (this.endedAtInput && this.endedAtInput.nativeElement)
                    this.endedAtInput.nativeElement.focus();
            }
        } catch (e) {
            // fallback: focus input
            try {
                if (which === 'started' && this.startedAtInput)
                    this.startedAtInput.nativeElement.focus();
                if (which === 'ended' && this.endedAtInput) this.endedAtInput.nativeElement.focus();
            } catch {}
        }
    }

    // Return true when either endedAt is empty or endedAt >= startedAt
    isDateRangeValid(): boolean {
        try {
            if (!this.incident) return true;
            const s = this.incident.startedAt ? new Date(this.incident.startedAt) : null;
            const e = this.incident.endedAt ? new Date(this.incident.endedAt) : null;
            if (!s || !e) return true;
            return e.getTime() >= s.getTime();
        } catch {
            return true;
        }
    }

    getEmptyIncident(): IncidentInterface {
        // Retorna um objeto limpo para o formulário de criação
        return {
            title: '',
            service: '',
            severity: SeverityEnum.SEV_3, // Valor padrão
            status: StatusEnum.OPEN,
            startedAt: this.toLocalDatetimeInputValue(new Date())!, // Data e hora atual (local, formato input)
            endedAt: '',
            impactShort: '',
        };
    }

    // Garantir que o input datetime-local sempre receba uma string no formato correto
    formatForInput(value: string | Date | null | undefined): string {
        const v = this.toLocalDatetimeInputValue(value);
        return v ?? '';
    }

    onSubmit(): void {
        // Prevent submit if form invalid (includes parse/range errors)
        try {
            if (this.incidentForm && this.incidentForm.invalid) {
                // mark controls as touched so validation messages appear in template
                try {
                    const form = this.incidentForm as any as NgForm;
                    if (form && form.controls) {
                        Object.values(form.controls).forEach(
                            (c: any) => c.markAsTouched && c.markAsTouched()
                        );
                    }
                } catch {}
                return;
            }

            // Also ensure date range is valid (in case template checks missed it)
            if (!this.isDateRangeValid()) {
                this.setRangeError('endedAt', true);
                return;
            }
        } catch (e) {
            // safeguard - if validation check fails, block submit
            return;
        }

        // Prepare payload copying the incident but converting local times to UTC ISO
        const { id: _id, ...raw } = this.incident as any;
        const payload: any = { ...raw };

        // convert local ISO-like (YYYY-MM-DDTHH:mm) to UTC ISO (Z) without milliseconds
        const localIsoStringToUtcIso = (localIso?: string | null): string | null => {
            if (!localIso) return null;
            // accept 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DDTHH:mm:ss'
            const [datePart, timePart] = localIso.split('T');
            if (!datePart) return null;
            const [y, m, d] = datePart.split('-').map((v) => Number(v));
            if (!y || !m || !d) return null;
            let hh = 0,
                mm = 0,
                ss = 0;
            if (timePart) {
                const parts = timePart.split(':').map((v) => Number(v));
                hh = parts[0] ?? 0;
                mm = parts[1] ?? 0;
                ss = parts[2] ?? 0;
            }
            // build local Date from components (this yields local time)
            const localDate = new Date(y, m - 1, d, hh, mm, ss);
            if (isNaN(localDate.getTime())) return null;
            // format without milliseconds: YYYY-MM-DDTHH:mm:ssZ
            const iso = localDate.toISOString();
            return iso.replace(/\.\d{3}Z$/, 'Z');
        };

        // convert startedAt and endedAt
        if (payload.startedAt) {
            const utc = localIsoStringToUtcIso(payload.startedAt);
            if (utc) payload.startedAt = utc;
        }
        if (payload.endedAt) {
            const utcE = localIsoStringToUtcIso(payload.endedAt);
            if (utcE) payload.endedAt = utcE;
            else payload.endedAt = null;
        }

        if (this.isEditMode && this.incident.id != null) {
            // Atualização de incidente existente
            this.incidentService.update(String(this.incident.id), payload).subscribe(() => {
                this.router.navigate(['/incidents']);
            });
        } else {
            // Criação de novo incidente (sem id no payload)
            this.incidentService.create(payload).subscribe(() => {
                this.router.navigate(['/incidents']);
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/incidents']);
    }

    private toLocalDatetimeInputValue(dateLike: Date | string | null | undefined): string | null {
        if (!dateLike) return null;
        const parsed = this.parseToDate(dateLike);
        if (!parsed) {
            return null;
        }
        const tzOffset = parsed.getTimezoneOffset();
        const local = new Date(parsed.getTime() - tzOffset * 60000);
        return local.toISOString().slice(0, 16);
    }

    private parseToDate(dateLike: Date | string | null | undefined): Date | null {
        if (!dateLike) {
            return null;
        }
        if (dateLike instanceof Date) {
            const cloned = new Date(dateLike.getTime());
            return isNaN(cloned.getTime()) ? null : cloned;
        }
        const normalized =
            dateLike.includes(' ') && !dateLike.includes('T')
                ? dateLike.replace(' ', 'T')
                : dateLike;
        const parsed = new Date(normalized);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    // Load the prebuilt Material theme from the public folder (only once)
    private loadMaterialTheme(): void {
        try {
            if (typeof document === 'undefined') return;
            const id = 'material-theme';
            if (document.getElementById(id)) return; // already loaded
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = '/material-indigo-pink.css';
            document.head.appendChild(link);
        } catch (e) {
            // non-fatal; proceed without theme
        }
    }
}
