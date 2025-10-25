import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { IncidentResponseInterface } from '../../domain/interfaces/response/incident-response-interface';
import { IncidentService } from '../../services/incident-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// Font Awesome
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';

import { Subscription } from 'rxjs';
import { SeverityEnum } from '../../domain/enums/severity-enum';
import { StatusEnum } from '../../domain/enums/status-enum';

@Component({
    selector: 'app-incident-list-component',
    // add material & fontawesome modules to the component imports so the template can use them
    imports: [
        CommonModule,
        FormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatTooltipModule,
        FontAwesomeModule,
    ],
    templateUrl: './incident-list-component.html',
    styleUrls: ['./incident-list-component.scss'],
})
export class IncidentListComponent implements OnInit, OnDestroy {
    incidents: IncidentResponseInterface[] = [];
    displayedColumns: string[] = [
        'id',
        'title',
        'service',
        'severity',
        'status',
        'startedAt',
        'endedAt',
        'mttr',
        'score',
        'actions',
    ];

    @ViewChild(MatPaginator) paginator?: MatPaginator;

    readonly availableSeverities = Object.values(SeverityEnum);
    readonly availableStatus = Object.values(StatusEnum);

    totalItems = 0;
    pageIndex = 0;
    pageSize = 10;
    readonly pageSizeOptions = [5, 10, 20];
    sortActive = 'createdAt';
    sortDirection: 'asc' | 'desc' = 'desc';

    private requestSub?: Subscription;

    filters = {
        service: '',
        severity: '',
        status: '',
    };

    constructor(
        private incidentService: IncidentService,
        private router: Router,
        private faLibrary: FaIconLibrary
    ) {
        // register pencil icon
        try {
            this.faLibrary.addIcons(faPencil);
        } catch (e) {
            // ignore if library not available
        }
    }

    // expose the icon to the template to use <fa-icon [icon]="pencil"></fa-icon>
    public pencil = faPencil;

    ngOnInit(): void {
        this.loadIncidents();
    }

    ngOnDestroy(): void {
        this.requestSub?.unsubscribe();
    }

    loadIncidents(): void {
        const query = {
            page: this.pageIndex,
            size: this.pageSize,
            serviceName: this.filters.service?.trim() || undefined,
            severity: this.mapSeverityToQuery(this.filters.severity),
            status: this.mapStatusToQuery(this.filters.status),
            sort: this.resolveSortField(this.sortActive),
            direction: this.sortDirection.toUpperCase() as 'ASC' | 'DESC',
        };

        this.requestSub?.unsubscribe();
        this.requestSub = this.incidentService.list(query).subscribe((page) => {
            const content = Array.isArray(page) ? page : page?.content ?? [];
            if (page && typeof page.number === 'number') {
                this.pageIndex = page.number;
            }
            if (page && typeof page.size === 'number') {
                this.pageSize = page.size;
            }
            const normalized = content.map((inc: any) => ({
                ...inc,
                severity: this.normalizeSeverity(inc.severity),
                status: this.normalizeStatus(inc.status),
            }));

            this.incidents = normalized;
            this.totalItems = page?.totalElements ?? normalized.length;
        });
    }

    onServiceChange(newValue: string): void {
        this.filters.service = (newValue || '').toString();
        this.resetToFirstPageAndReload();
    }

    onSeverityChange(newValue: string): void {
        this.filters.severity = (newValue || '').toString();
        this.resetToFirstPageAndReload();
    }

    onStatusChange(newValue: string): void {
        this.filters.status = (newValue || '').toString();
        this.resetToFirstPageAndReload();
    }

    onSortChange(sort: Sort): void {
        if (!sort.direction) {
            this.sortActive = 'createdAt';
            this.sortDirection = 'desc';
        } else {
            this.sortActive = sort.active;
            this.sortDirection = sort.direction as 'asc' | 'desc';
        }
        this.resetToFirstPageAndReload();
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadIncidents();
    }

    resetFilters(): void {
        this.filters = { service: '', severity: '', status: '' };
        this.resetToFirstPageAndReload();
    }

    get matSortActiveField(): string {
        return this.displayedColumns.includes(this.sortActive) ? this.sortActive : '';
    }

    createNewIncident(): void {
        this.router.navigate(['/incidents/new']);
    }

    editIncident(id: number): void {
        this.router.navigate(['/incidents/edit', id]);
    }

    // Funções para classes de estilo dinâmicas
    getSeverityClass(severity: IncidentResponseInterface['severity']): string {
        let color: string;
        switch (severity) {
            case 'SEV-1':
                color = 'bg-red-500 text-white';
                break;
            case 'SEV-2':
                color = 'bg-yellow-400 text-white';
                break;
            case 'SEV-3':
                color = 'bg-green-500 text-gray-800';
                break;
            case 'SEV-4':
                color = 'bg-blue-400 text-white';
                break;
            default:
                color = 'bg-gray-400 text-white';
        }
        return color;
    }

    getStatusClass(status: IncidentResponseInterface['status']): string {
        switch (status) {
            case 'Open':
                return 'bg-red-200 text-red-800 animate-pulse';
            case 'In Analysis':
                return 'bg-yellow-200 text-yellow-800';
            case 'Closed':
                return 'bg-green-200 text-green-800';
            default:
                return 'bg-gray-200 text-gray-800';
        }
    }

    private resetToFirstPageAndReload(): void {
        if (this.pageIndex !== 0) {
            this.pageIndex = 0;
            this.paginator?.firstPage();
        }
        this.loadIncidents();
    }

    private mapSeverityToQuery(
        value?: string
    ): SeverityEnum | keyof typeof SeverityEnum | undefined {
        if (!value) return undefined;
        const enumKey = Object.entries(SeverityEnum).find(([, label]) => label === value)?.[0];
        if (enumKey && enumKey in SeverityEnum) {
            return enumKey as keyof typeof SeverityEnum;
        }
        const enumValue = Object.values(SeverityEnum).find((label) => label === value);
        return enumValue ?? undefined;
    }

    private mapStatusToQuery(value?: string): StatusEnum | keyof typeof StatusEnum | undefined {
        if (!value) return undefined;
        const enumKey = Object.entries(StatusEnum).find(([, label]) => label === value)?.[0];
        if (enumKey && enumKey in StatusEnum) {
            return enumKey as keyof typeof StatusEnum;
        }
        const enumValue = Object.values(StatusEnum).find((label) => label === value);
        return enumValue ?? undefined;
    }

    private resolveSortField(column: string): string {
        const map: Record<string, string> = {
            id: 'id',
            title: 'title',
            service: 'service',
            severity: 'severity',
            status: 'status',
            startedAt: 'startedAt',
            endedAt: 'endedAt',
            mttr: 'mttrMinutes',
        };
        return map[column] ?? 'createdAt';
    }

    private normalizeSeverity(value: any): string {
        if (value === undefined || value === null || String(value).trim() === '') return '';
        const s = String(value).toUpperCase().trim();
        if (s.includes('SEV1') || s.includes('SEV-1') || s.includes('SEV_1')) return 'SEV-1';
        if (s.includes('SEV2') || s.includes('SEV-2') || s.includes('SEV_2')) return 'SEV-2';
        if (s.includes('SEV3') || s.includes('SEV-3') || s.includes('SEV_3')) return 'SEV-3';
        if (s.includes('SEV4') || s.includes('SEV-4') || s.includes('SEV_4')) return 'SEV-4';
        return String(value);
    }

    private normalizeStatus(value: any): string {
        if (value === undefined || value === null || String(value).trim() === '') return '';
        const s = String(value).toUpperCase().trim();
        if (s === 'OPEN' || s === 'OPENED') return 'Open';
        if (s === 'IN_ANALYSIS' || s === 'IN ANALYSIS' || s === 'INANALYSIS' || s === 'IN-ANALYSIS')
            return 'In Analysis';
        if (s === 'CLOSED' || s === 'CLOSE') return 'Closed';
        if (s.includes('OPEN')) return 'Open';
        if (s.includes('CLOSED') || s.includes('CLOSE')) return 'Closed';
        if (s.includes('ANALYS')) return 'In Analysis';
        return String(value);
    }
}
