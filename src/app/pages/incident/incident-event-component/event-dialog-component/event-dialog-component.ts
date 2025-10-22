import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {TextFieldModule} from '@angular/cdk/text-field';
import {EventTypeEnum} from '../../../../domain/enums/event-type-enum';
import {IncidentEventInterface} from '../../../../domain/interfaces/request/incident-event-interface';
import {IncidentEventResponseInterface} from '../../../../domain/interfaces/response/incident-event-response-interface';
import {FontAwesomeModule, FaIconLibrary} from '@fortawesome/angular-fontawesome';
import {faCalendarDay, faXmark} from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-event-dialog-component',
    standalone: true,
    imports: [
        CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
        MatInputModule, MatSelectModule, MatButtonModule,
        TextFieldModule, FontAwesomeModule
    ],
    templateUrl: './event-dialog-component.html',
    styleUrls: ['./event-dialog-component.scss']
})
export class EventDialogComponent {
    event: IncidentEventInterface;
    eventTypes = [
        { id: EventTypeEnum.ALERT, name: 'Alerta' },
        { id: EventTypeEnum.DIAGNOSIS, name: 'Diagnóstico' },
        { id: EventTypeEnum.MITIGATION, name: 'Mitigação' },
        { id: EventTypeEnum.FIX, name: 'Correção (Fix)' },
        { id: EventTypeEnum.COMMUNICATION, name: 'Comunicação' },
    ];
    public readonly xmark = faXmark;
    public readonly calendarDay = faCalendarDay;

    constructor(
        public dialogRef: MatDialogRef<EventDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { event?: IncidentEventResponseInterface | IncidentEventInterface, isEdit: boolean, incidentId?: number },
        private readonly faLibrary: FaIconLibrary,
    ) {
        // Inicializa de forma segura: se veio um evento, clona; senão cria um objeto padrão
        // Se veio um evento do backend, convertê-lo para o formato do <input type="datetime-local"> (yyyy-MM-ddTHH:mm)
        if (this.data?.event) {
            this.event = { ...this.data.event } as IncidentEventInterface;
            this.event.eventAt = this.toInputFormat(this.event.eventAt);
        } else {
            this.event = {
                eventAt: this.toInputFormat(),
                type: EventTypeEnum.ALERT,
                description: ''
            } as IncidentEventInterface;
        }

        try {
            this.faLibrary.addIcons(faXmark, faCalendarDay);
        } catch (e) {
            // noop - library unavailable
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    // Public method used by the template to return the event payload formatted for the backend
    serializeEvent(): IncidentEventInterface {
        const ev: IncidentEventInterface = { ...this.event } as IncidentEventInterface;
        ev.eventAt = this.formatForBackend(ev.eventAt);
        return ev;
    }

    // Convert 'datetime-local' input value (yyyy-MM-ddTHH:mm or with seconds) to backend format 'yyyy-MM-dd HH:mm:ss'
    private formatForBackend(input?: string): string {
        if (!input) return input as string;
        let dt = input;
        // If input uses 'T' separator (datetime-local), replace with space
        if (dt.includes('T')) dt = dt.replace('T', ' ');
        // Ensure seconds are present
        if (!/\d{2}:\d{2}:\d{2}$/.test(dt)) {
            // dt probably ends with 'HH:mm' -> add ':00'
            dt = dt + ':00';
        }
        return dt;
    }

    // Convert backend date string (e.g. 'yyyy-MM-dd HH:mm:ss') or ISO (yyyy-MM-ddTHH:mm:ssZ) to 'yyyy-MM-ddTHH:mm' for the input
    private toInputFormat(input?: string): string {
        if (!input) {
            // default to current local datetime in format yyyy-MM-ddTHH:mm
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const yyyy = now.getFullYear();
            const mm = pad(now.getMonth() + 1);
            const dd = pad(now.getDate());
            const hh = pad(now.getHours());
            const min = pad(now.getMinutes());
            return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
        }
        let dt = input.trim();
        // If backend format 'yyyy-MM-dd HH:mm:ss', replace space with 'T' and drop seconds
        if (dt.includes(' ')) {
            dt = dt.replace(' ', 'T');
        }
        // If it has seconds or timezone, normalize by slicing the first 16 characters 'yyyy-MM-ddTHH:mm'
        if (dt.length >= 16) {
            return dt.slice(0, 16);
        }
        return dt;
    }

    isFormValid(): boolean {
        return !!this.event.eventAt && !!this.event.type && !!this.event.description?.trim();
    }
}
