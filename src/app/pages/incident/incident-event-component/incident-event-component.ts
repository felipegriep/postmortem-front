import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IncidentEventResponseInterface } from '../../../domain/interfaces/response/incident-event-response-interface';
import { EventTypeEnum } from '../../../domain/enums/event-type-enum';
import { IncidentEventService } from '../../../services/incident-event-service';
import { IncidentEventInterface } from '../../../domain/interfaces/request/incident-event-interface';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ToastService } from '../../../shared/toast.service';
import { DATE_DISPLAY_FORMAT } from '../../../shared/date.constants';

@Component({
    selector: 'app-incident-event-component',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatTooltipModule, FontAwesomeModule],
    templateUrl: './incident-event-component.html',
    styleUrls: ['./incident-event-component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentEventComponent implements OnInit, OnChanges {
    @Input() incidentId?: number;
    @Output() addEventRequested = new EventEmitter<void>();
    @Output() editEventRequested = new EventEmitter<IncidentEventResponseInterface>();

    displayedColumns: string[] = ['eventAt', 'type', 'description', 'actions'];
    dataSource = new MatTableDataSource<IncidentEventResponseInterface>();
    private hasLoadedOnce = false;

    public readonly plus = faPlus;
    public readonly edit = faPen;
    public readonly trash = faTrash;
    readonly dateDisplayFormat = DATE_DISPLAY_FORMAT;

    constructor(
        private incidentEventService: IncidentEventService,
        private readonly cdr: ChangeDetectorRef,
        private readonly faLibrary: FaIconLibrary,
        private readonly toast: ToastService
    ) {
        try {
            this.faLibrary.addIcons(faPlus, faPen, faTrash);
        } catch (e) {
            // noop - library unavailable
        }
    }

    ngOnInit(): void {
        if (!this.hasLoadedOnce && this.incidentId) {
            this.loadEvents();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        const incidentIdChange = changes['incidentId'];
        if (!incidentIdChange) return;
        const currentId = incidentIdChange.currentValue;
        if (!currentId && currentId !== 0) return;
        const previousId = incidentIdChange.previousValue;
        if (!this.hasLoadedOnce || currentId !== previousId) {
            this.loadEvents();
        }
    }

    loadEvents(): void {
        if (!this.incidentId) return;
        this.incidentEventService.list(this.incidentId).subscribe((events) => {
            this.dataSource.data = events;
            this.hasLoadedOnce = true;
            this.cdr.markForCheck();
        });
    }

    deleteEvent(eventId: number): void {
        // Adicionar um confirm aqui seria uma boa prática em um app real
        if (!this.incidentId) return;
        this.incidentEventService.delete(this.incidentId, eventId).subscribe(() => {
            this.toast.success('Evento removido com sucesso!');
            this.loadEvents();
        });
    }

    requestCreateEvent(): void {
        this.addEventRequested.emit();
    }

    requestEditEvent(event: IncidentEventResponseInterface): void {
        this.editEventRequested.emit(event);
    }

    createEvent(event: IncidentEventInterface): void {
        if (!this.incidentId) {
            return;
        }
        this.incidentEventService.create(this.incidentId, event).subscribe(() => {
            this.toast.success('Evento adicionado na linha do tempo!');
            if (typeof window !== 'undefined') {
                window.location.reload();
            } else {
                this.loadEvents();
            }
        });
    }

    updateEvent(eventId: number, event: IncidentEventInterface): void {
        if (!this.incidentId) {
            return;
        }
        this.incidentEventService.update(this.incidentId, eventId, event).subscribe(() => {
            this.toast.success('Evento atualizado com sucesso!');
            if (typeof window !== 'undefined') {
                window.location.reload();
            } else {
                this.loadEvents();
            }
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

    formatDescription(description: string, limit = 50): string {
        if (!description) return '';
        const trimmed = description.trim();
        if (trimmed.length <= limit) return trimmed;
        return trimmed.slice(0, limit).concat('…');
    }
}
