import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import { IncidentEventComponent } from '../incident-event-component/incident-event-component';
import { EventDialogComponent } from '../incident-event-component/event-dialog-component/event-dialog-component';
import { IncidentEventResponseInterface } from '../../../domain/interfaces/response/incident-event-response-interface';
import { IncidentEventInterface } from '../../../domain/interfaces/request/incident-event-interface';
import { IncidentService } from '../../../services/incident-service';
import { take } from 'rxjs';

@Component({
    selector: 'app-incident-timeline-tab',
    standalone: true,
    imports: [CommonModule, MatSidenavModule, IncidentEventComponent, EventDialogComponent],
    templateUrl: './incident-timeline-tab.component.html',
    styleUrls: ['./incident-timeline-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentTimelineTabComponent implements OnInit {
    @ViewChild('eventDrawer', { static: false }) eventDrawer?: MatDrawer;
    @ViewChild(IncidentEventComponent, { static: false })
    incidentEventList?: IncidentEventComponent;

    incidentId?: number;
    incidentStartedAt?: string;
    isEventDrawerOpen = false;
    isEventDrawerEdit = false;
    private editingEventId?: number;
    drawerEventData?: IncidentEventResponseInterface;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly incidentService: IncidentService,
        private readonly cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        const idParam =
            this.route.parent?.snapshot.paramMap.get('id') ??
            this.route.snapshot.paramMap.get('id');
        if (idParam) {
            const parsed = Number(idParam);
            this.incidentId = Number.isNaN(parsed) ? undefined : parsed;
            if (this.incidentId) {
                this.incidentService
                    .get(this.incidentId)
                    .pipe(take(1))
                    .subscribe({
                        next: (incident) => {
                            if (!incident) {
                                this.incidentStartedAt = undefined;
                                return;
                            }
                            const started = incident.startedAt as unknown;
                            if (started instanceof Date) {
                                this.incidentStartedAt = started.toISOString();
                            } else if (typeof started === 'string') {
                                this.incidentStartedAt = started;
                            } else {
                                const parsedDate = new Date(started as any);
                                this.incidentStartedAt = isNaN(parsedDate.getTime())
                                    ? undefined
                                    : parsedDate.toISOString();
                            }
                            this.cdr.markForCheck();
                        },
                    });
            }
        }
    }

    openEventDrawer(event?: IncidentEventResponseInterface): void {
        this.isEventDrawerEdit = !!event;
        this.editingEventId = event?.id;
        this.drawerEventData = event ? { ...event } : undefined;
        this.isEventDrawerOpen = true;
        this.eventDrawer?.open();
    }

    closeEventDrawer(): void {
        this.isEventDrawerOpen = false;
        this.eventDrawer?.close();
    }

    onEventDrawerClosed(): void {
        this.isEventDrawerOpen = false;
        this.isEventDrawerEdit = false;
        this.editingEventId = undefined;
        this.drawerEventData = undefined;
    }

    handleEventSubmit(event: IncidentEventInterface): void {
        if (!this.incidentEventList || !this.incidentId) {
            return;
        }
        if (this.isEventDrawerEdit && this.editingEventId != null) {
            this.incidentEventList.updateEvent(this.editingEventId, event);
        } else {
            this.incidentEventList.createEvent(event);
        }
        this.closeEventDrawer();
    }
}
