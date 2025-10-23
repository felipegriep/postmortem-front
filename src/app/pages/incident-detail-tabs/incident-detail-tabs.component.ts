import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, startWith, Subject, takeUntil } from 'rxjs';
import { IncidentService } from '../../services/incident-service';
import { IncidentResponseInterface } from '../../domain/interfaces/response/incident-response-interface';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';

interface IncidentSummary {
    id?: string;
    title?: string;
    severity?: IncidentResponseInterface['severity'];
    status?: IncidentResponseInterface['status'];
    startedAt?: Date | null;
    endedAt?: Date | null;
}

interface TabLink {
    label: string;
    commands: any[];
    requiresExisting: boolean;
}

@Component({
    selector: 'app-incident-detail-tabs',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatTabsModule,
        MatCardModule,
    ],
    templateUrl: './incident-detail-tabs.component.html',
    styleUrls: ['./incident-detail-tabs.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentDetailTabsComponent implements OnInit, OnDestroy {
    tabLinks: TabLink[] = [
        { label: 'Detalhes', commands: [], requiresExisting: false },
        { label: 'Timeline', commands: ['timeline'], requiresExisting: true },
        { label: 'Análise', commands: ['analysis'], requiresExisting: true },
    ];

    selectedIndex = 0;
    isNewIncident = false;
    summary: IncidentSummary = {};

    private destroy$ = new Subject<void>();

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly incidentService: IncidentService,
        private readonly cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        this.isNewIncident = !idParam;
        if (idParam) {
            this.fetchIncidentSummary(idParam);
        } else {
            this.summary = {};
        }

        this.router.events
            .pipe(
                filter((event): event is NavigationEnd => event instanceof NavigationEnd),
                startWith(null),
                takeUntil(this.destroy$),
                map(() => this.route.firstChild?.snapshot.routeConfig?.path ?? '')
            )
            .subscribe((path) => {
                const newIndex =
                    path === 'timeline' ? 1 : path === 'analysis' ? 2 : 0;
                if (this.selectedIndex !== newIndex) {
                    this.selectedIndex = newIndex;
                    this.cdr.markForCheck();
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onTabChange(index: number): void {
        const previousIndex = this.selectedIndex;
        if (index === previousIndex) {
            return;
        }
        const link = this.tabLinks[index];
        if (!link) {
            return;
        }
        if (link.requiresExisting && this.isNewIncident) {
            this.selectedIndex = previousIndex;
            this.cdr.markForCheck();
            return;
        }
        this.selectedIndex = index;
        this.cdr.markForCheck();
        const commands = link.commands ?? [];
        if (!commands.length) {
            const childRoute = this.route.firstChild;
            if (childRoute) {
                this.router.navigate(['../'], { relativeTo: childRoute });
            }
            return;
        }
        this.router.navigate(commands, { relativeTo: this.route });
    }

    private fetchIncidentSummary(id: string): void {
        this.incidentService
            .get(Number(id))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (incident) => {
                    this.summary = {
                        id: incident.id,
                        title: incident.title,
                        severity: incident.severity,
                        status: incident.status,
                        startedAt: this.toDate(incident.startedAt),
                        endedAt: this.toDate(incident.endedAt),
                    };
                    this.cdr.markForCheck();
                },
            });
    }

    private toDate(input: Date | string | null | undefined): Date | null {
        if (!input) {
            return null;
        }
        const value =
            typeof input === 'string' && input.includes(' ') && !input.includes('T')
                ? input.replace(' ', 'T')
                : input;
        const date = new Date(value as any);
        return isNaN(date.getTime()) ? null : date;
    }
}
