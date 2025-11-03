import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, switchMap, take } from 'rxjs/operators';
import { RootCauseService } from '../../../services/root-cause-service';
import { RootCauseInterface } from '../../../domain/interfaces/request/root-cause-interface';
import { RootCauseResponseInterface } from '../../../domain/interfaces/response/root-cause-response-interface';
import { formatDateToDisplay } from '../../../shared/date-utils';

@Component({
    selector: 'app-incident-analysis-tab',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TextFieldModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        MatToolbarModule,
        MatIconModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './incident-analysis-tab.component.html',
    styleUrls: ['./incident-analysis-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentAnalysisTabComponent implements OnInit, OnChanges {
    @Input() incidentId!: number;

    rca: RootCauseInterface | null = null;
    private hasExistingRca = false;
    private lastUpdatedAt: string | null = null;
    isLoading = false;
    isSaving = false;

    constructor(
        private readonly rcaService: RootCauseService,
        private readonly cdr: ChangeDetectorRef,
        private readonly route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        if (!this.incidentId) {
            const resolvedId = this.resolveIncidentIdFromRoute();
            if (resolvedId) {
                this.incidentId = resolvedId;
            }
        }

        if (this.incidentId) {
            this.loadRca();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        const incidentIdChange = changes['incidentId'];
        if (
            incidentIdChange &&
            incidentIdChange.currentValue &&
            incidentIdChange.currentValue !== incidentIdChange.previousValue
        ) {
            this.loadRca();
        }
    }

    get lastUpdatedDisplay(): string | null {
        return formatDateToDisplay(this.lastUpdatedAt);
    }

    get isBusy(): boolean {
        return this.isLoading || this.isSaving;
    }

    // --- Getters para o Painel de Progresso ---
    get whysComplete(): boolean {
        if (!this.rca) return false;
        return !!(
            this.rca.why1?.trim() &&
            this.rca.why2?.trim() &&
            this.rca.why3?.trim() &&
            this.rca.why4?.trim() &&
            this.rca.why5?.trim()
        );
    }

    get causeFactorsComplete(): boolean {
        if (!this.rca) return false;
        return !!(this.rca.rootCauseText?.trim() && this.rca.contributingFactors?.trim());
    }

    // --- Métodos de Dados ---
    loadRca(): void {
        if (!this.incidentId) return;
        this.isLoading = true;
        this.cdr.markForCheck();

        this.rcaService
            .get(this.incidentId)
            .pipe(
                take(1),
                finalize(() => {
                    this.isLoading = false;
                    this.cdr.markForCheck();
                })
            )
            .subscribe({
                next: (data: RootCauseResponseInterface | null) => {
                    this.applyRcaResponse(data);
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.applyRcaResponse(null);
                    this.cdr.markForCheck();
                },
            });
    }

    onSave(): void {
        if (!this.rca || !this.incidentId) return;

        const payload: RootCauseInterface = {
            ...this.rca,
            why1: this.rca.why1 ?? '',
            why2: this.rca.why2 ?? '',
            why3: this.rca.why3 ?? '',
            why4: this.rca.why4 ?? '',
            why5: this.rca.why5 ?? '',
            rootCauseText: this.rca.rootCauseText ?? '',
            contributingFactors: this.rca.contributingFactors ?? '',
            lessonsLearned: this.rca.lessonsLearned ?? '',
        };

        this.isSaving = true;
        this.cdr.markForCheck();

        const save$: Observable<unknown> = this.hasExistingRca
            ? this.rcaService.update(this.incidentId, payload)
            : this.rcaService.create(this.incidentId, payload);

        save$
            .pipe(
                switchMap(() => this.rcaService.get(this.incidentId)),
                take(1),
                catchError(() => of(null))
            )
            .subscribe({
                next: (data: RootCauseResponseInterface | null) => {
                    this.applyRcaResponse(data);
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.applyRcaResponse(null);
                    this.isSaving = false;
                    this.cdr.markForCheck();
                },
                complete: () => {
                    this.isSaving = false;
                    this.cdr.markForCheck();
                },
            });
    }

    private applyRcaResponse(data: RootCauseResponseInterface | null): void {
        if (data) {
            this.rca = {
                why1: data.why1 ?? '',
                why2: data.why2 ?? '',
                why3: data.why3 ?? '',
                why4: data.why4 ?? '',
                why5: data.why5 ?? '',
                rootCauseText: data.rootCauseText ?? '',
                contributingFactors: data.contributingFactors ?? '',
                lessonsLearned: data.lessonsLearned ?? '',
            };
            this.hasExistingRca = true;
            this.lastUpdatedAt = data.updatedAt ?? data.createdAt ?? null;
        } else {
            this.rca = {
                why1: '',
                why2: '',
                why3: '',
                why4: '',
                why5: '',
                rootCauseText: '',
                contributingFactors: '',
                lessonsLearned: '',
            };
            this.hasExistingRca = false;
            this.lastUpdatedAt = null;
        }
    }

    private resolveIncidentIdFromRoute(): number | null {
        const candidateParamMaps = [
            this.route.snapshot.paramMap,
            this.route.parent?.snapshot.paramMap,
            this.route.parent?.parent?.snapshot.paramMap,
        ].filter((paramMap): paramMap is typeof this.route.snapshot.paramMap => !!paramMap);

        for (const paramMap of candidateParamMaps) {
            const idValue = paramMap.get('id');
            if (idValue) {
                const parsed = Number(idValue);
                if (!Number.isNaN(parsed)) {
                    return parsed;
                }
            }
        }

        return null;
    }
}
