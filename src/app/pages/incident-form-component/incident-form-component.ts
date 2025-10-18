import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IncidentService } from '../../services/incident-service';
import { IncidentInterface } from '../../domain/interfaces/request/incident-interface';
import { SeverityEnum } from '../../domain/enums/severity-enum';
import { StatusEnum } from '../../domain/enums/status-enum';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-incident-form-component',
    imports: [NgIf, FormsModule],
    templateUrl: './incident-form-component.html',
    styleUrls: ['./incident-form-component.scss'],
})
export class IncidentFormComponent implements OnInit {
    incident: IncidentInterface = this.getEmptyIncident();
    isEditMode = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private incidentService: IncidentService
    ) {}

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.isEditMode = true;
            const incidentId = +idParam;
            this.incidentService.getIncidentById(incidentId).subscribe((incident) => {
                if (incident) {
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
                } else {
                    // Tratar caso de incidente não encontrado, redirecionando para a lista
                    this.router.navigate(['/incidents']);
                }
            });
        } else {
            this.isEditMode = false;
            this.incident = this.getEmptyIncident();
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
        if (this.isEditMode && this.incident.id != null) {
            // Atualização de incidente existente
            this.incidentService
                .updateIncident(String(this.incident.id), this.incident)
                .subscribe(() => {
                    this.router.navigate(['/incidents']);
                });
        } else {
            // Criação de novo incidente (sem id no payload)
            // prefix discarded var with _ to satisfy no-unused-vars rule
            const { id: _id, ...payload } = this.incident as any;
            this.incidentService.createIncident(payload).subscribe(() => {
                this.router.navigate(['/incidents']);
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/incidents']);
    }

    private toLocalDatetimeInputValue(dateLike: Date | string | null | undefined): string | null {
        if (!dateLike) return null;
        const d = new Date(dateLike);
        if (isNaN(d.getTime())) return null;
        const tzOffset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - tzOffset * 60000);
        return local.toISOString().slice(0, 16);
    }
}
