import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import { IncidentEventComponent } from '../incident-event-component/incident-event-component';
import { EventDialogComponent } from '../incident-event-component/event-dialog-component/event-dialog-component';
import { IncidentEventResponseInterface } from '../../../domain/interfaces/response/incident-event-response-interface';
import { IncidentEventInterface } from '../../../domain/interfaces/request/incident-event-interface';

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
    isEventDrawerOpen = false;
    isEventDrawerEdit = false;
    private editingEventId?: number;
    drawerEventData?: IncidentEventResponseInterface;

    constructor(private readonly route: ActivatedRoute) {}

    ngOnInit(): void {
        const idParam =
            this.route.parent?.snapshot.paramMap.get('id') ??
            this.route.snapshot.paramMap.get('id');
        if (idParam) {
            const parsed = Number(idParam);
            this.incidentId = Number.isNaN(parsed) ? undefined : parsed;
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
