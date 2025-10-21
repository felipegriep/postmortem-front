import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatTooltipModule} from '@angular/material/tooltip';
import {IncidentEventResponseInterface} from '../../../domain/interfaces/response/incident-event-response-interface';
import {EventTypeEnum} from '../../../domain/enums/event-type-enum';
import {IncidentEventService} from '../../../services/incident-event-service';
import {IncidentEventInterface} from '../../../domain/interfaces/request/incident-event-interface';
import {EventDialogComponent} from './event-dialog-component/event-dialog-component';

@Component({
    selector: 'app-incident-event-component',
    standalone: true,
    imports: [
        CommonModule, MatTableModule, MatIconModule, MatButtonModule,
        MatDialogModule, MatTooltipModule
    ],
    templateUrl: './incident-event-component.html',
    styleUrls: ['./incident-event-component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentEventComponent implements OnInit {
    @Input() incidentId?: number;

    displayedColumns: string[] = ['eventAt', 'type', 'description', 'actions'];
    dataSource = new MatTableDataSource<IncidentEventResponseInterface>();

    constructor(
        private incidentEventService: IncidentEventService,
        public dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.loadEvents();
    }

    loadEvents(): void {
        if (!this.incidentId) return;
        this.incidentEventService.list(this.incidentId).subscribe(events => {
            this.dataSource.data = events;
        });
    }

    openEventDialog(event?: IncidentEventResponseInterface): void {
        const dialogRef = this.dialog.open(EventDialogComponent, {
            width: '500px',
            data: { event, isEdit: !!event, incidentId: this.incidentId },
            disableClose: true,
        });

        dialogRef.afterClosed().subscribe(result => {
            if (!result) return;
            const payload = result as { event: IncidentEventInterface, isEdit: boolean, id?: number };
            if (!this.incidentId) return;
            if (payload.isEdit) {
                // update requires the event id
                if (!payload.id) return;
                this.incidentEventService.update(this.incidentId, payload.id, payload.event).subscribe(() => this.loadEvents());
            } else {
                this.incidentEventService.create(this.incidentId, payload.event).subscribe(() => this.loadEvents());
            }
        });
    }

    deleteEvent(eventId: number): void {
        // Adicionar um confirm aqui seria uma boa prática em um app real
        if (!this.incidentId) return;
        this.incidentEventService.delete(this.incidentId, eventId).subscribe(() => {
            this.loadEvents();
        });
    }

    getTypeClass(type: EventTypeEnum | string): string {
        const classes: Record<EventTypeEnum | string, string> = {
            ALERT: 'bg-red-100 text-red-800',
            DIAGNOSIS: 'bg-yellow-100 text-yellow-800',
            MITIGATION: 'bg-blue-100 text-blue-800',
            FIX: 'bg-green-100 text-green-800',
            COMMUNICATION: 'bg-indigo-100 text-indigo-800',
        } as Record<EventTypeEnum | string, string>;
        return classes[type] ?? 'bg-gray-100 text-gray-800';
    }

}
