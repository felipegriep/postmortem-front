import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { IncidentResponseInterface } from '../../domain/interfaces/response/incident-response-interface';
import { IncidentService } from '../../services/incident-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// Font Awesome
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faPencil } from '@fortawesome/free-solid-svg-icons';

import { MatTableDataSource } from '@angular/material/table';

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
export class IncidentListComponent implements OnInit, AfterViewInit, OnDestroy {
    allIncidents: IncidentResponseInterface[] = [];
    filteredIncidents: IncidentResponseInterface[] = [];

    // Material table data source
    dataSource = new MatTableDataSource<IncidentResponseInterface>([]);
    displayedColumns: string[] = [
        'id',
        'title',
        'service',
        'severity',
        'status',
        'startedAt',
        'endedAt',
        'mttr',
        'actions',
    ];

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    // Opções para os filtros
    availableServices: string[] = [];
    availableSeverities: string[] = [];
    availableStatus: string[] = [];

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

    ngAfterViewInit(): void {
        try {
            if (this.paginator) this.dataSource.paginator = this.paginator;
            if (this.sort) this.dataSource.sort = this.sort;
        } catch (e) {}
    }

    loadIncidents(): void {
        this.incidentService.list().subscribe((resp) => {
            const pageAny: any = resp as any;
            const data: IncidentResponseInterface[] = Array.isArray(pageAny)
                ? pageAny
                : pageAny?.content ?? [];

            console.log('Incidents loaded:', data);

            // Normalize incoming data: map common variants to canonical strings
            const normalizeSeverityIncoming = (v: any): string => {
                if (v === undefined || v === null || String(v).trim() === '') return '';
                const s = String(v).toUpperCase().trim();
                if (s.includes('SEV1') || s.includes('SEV-1') || s.includes('SEV_1'))
                    return 'SEV-1';
                if (s.includes('SEV2') || s.includes('SEV-2') || s.includes('SEV_2'))
                    return 'SEV-2';
                if (s.includes('SEV3') || s.includes('SEV-3') || s.includes('SEV_3'))
                    return 'SEV-3';
                if (s.includes('SEV4') || s.includes('SEV-4') || s.includes('SEV_4'))
                    return 'SEV-4';
                return String(v);
            };

            const normalizeStatusIncoming = (v: any): string => {
                if (v === undefined || v === null || String(v).trim() === '') return '';
                const s = String(v).toUpperCase().trim();
                if (s === 'OPEN' || s === 'OPENED') return 'Open';
                if (
                    s === 'IN_ANALYSIS' ||
                    s === 'IN ANALYSIS' ||
                    s === 'INANALYSIS' ||
                    s === 'IN-ANALYSIS'
                )
                    return 'In Analysis';
                if (s === 'CLOSED' || s === 'CLOSE') return 'Closed';
                if (s.includes('OPEN')) return 'Open';
                if (s.includes('CLOSED') || s.includes('CLOSE')) return 'Closed';
                if (s.includes('ANALYS')) return 'In Analysis';
                return String(v);
            };

            const mapped = data.map((inc: any) => ({
                ...inc,
                severity: normalizeSeverityIncoming(inc.severity),
                status: normalizeStatusIncoming(inc.status),
            }));

            // Ordenação resiliente
            this.allIncidents = [...mapped].sort((a, b) => {
                const aNum = Number(a.id);
                const bNum = Number(b.id);
                const aNumOk = !Number.isNaN(aNum);
                const bNumOk = !Number.isNaN(bNum);
                if (aNumOk && bNumOk) return bNum - aNum;

                const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
                if (bTime !== aTime) return bTime - aTime;

                return String(b.id).localeCompare(String(a.id));
            });

            this.filteredIncidents = this.allIncidents;
            this.populateFilterOptions();
            this.applyFilters();

            // update material table source
            this.dataSource.data = this.filteredIncidents;
            try {
                if (this.paginator) this.dataSource.paginator = this.paginator;
                if (this.sort) this.dataSource.sort = this.sort;
            } catch (e) {}
        });
    }

    populateFilterOptions(): void {
        const services = this.allIncidents.map((inc) => inc.service);
        this.availableServices = [...new Set(services)];
        const sevs = this.allIncidents
            .map((inc) => inc.severity)
            .filter((s) => s !== undefined && s !== null && String(s).trim() !== '');
        this.availableSeverities = [...new Set(sevs)].sort();
        const stats = this.allIncidents
            .map((inc) => inc.status)
            .filter((s) => s !== undefined && s !== null && String(s).trim() !== '');
        this.availableStatus = [...new Set(stats)].sort();
    }

    // Handlers that receive the new value from (ngModelChange) and update filters before applying
    onServiceChange(newValue: string): void {
        this.filters.service = (newValue || '').toString();
        this.applyFilters();
    }

    onSeverityChange(newValue: string): void {
        this.filters.severity = (newValue || '').toString();
        this.applyFilters();
    }

    onStatusChange(newValue: string): void {
        this.filters.status = (newValue || '').toString();
        this.applyFilters();
    }

    applyFilters(): void {
        let incidents = [...this.allIncidents];

        if (this.filters.service && this.filters.service.toString().trim() !== '') {
            const f = this.filters.service.toString().toLowerCase().trim();
            incidents = incidents.filter((inc) =>
                (inc.service || '').toString().toLowerCase().includes(f)
            );
        }

        const normalizeKey = (v: any) =>
            String(v || '')
                .toUpperCase()
                .trim()
                .replace(/[^A-Z0-9]/g, '');

        if (this.filters.severity && this.filters.severity.toString().trim() !== '') {
            const sevNorm = normalizeKey(this.filters.severity);
            incidents = incidents.filter((inc) => normalizeKey(inc.severity) === sevNorm);
        }

        if (this.filters.status && this.filters.status.toString().trim() !== '') {
            const statNorm = normalizeKey(this.filters.status);
            incidents = incidents.filter((inc) => normalizeKey(inc.status) === statNorm);
        }

        this.filteredIncidents = incidents;
        // update table datasource
        this.dataSource.data = this.filteredIncidents;
    }

    resetFilters(): void {
        this.filters = { service: '', severity: '', status: '' };
        this.applyFilters();
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

    ngOnDestroy(): void {
        // nothing to cleanup now
    }
}
