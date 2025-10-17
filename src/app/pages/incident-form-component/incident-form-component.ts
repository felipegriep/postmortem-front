import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {IncidentService} from '../../services/incident-service';
import {IncidentInterface} from '../../domain/interfaces/request/incident-interface';
import {SeverityEnum} from '../../domain/enums/severity-enum';
import {StatusEnum} from '../../domain/enums/status-enum';
import {NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-incident-form-component',
  imports: [
    NgIf,
    FormsModule
  ],
  templateUrl: './incident-form-component.html',
  styleUrls: ['./incident-form-component.scss']
})
export class IncidentFormComponent  implements OnInit {

  incident: IncidentInterface = this.getEmptyIncident();
  isEditMode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private incidentService: IncidentService
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      const incidentId = +idParam;
      this.incidentService.getIncidentById(incidentId).subscribe(incident => {
        if (incident) {
          // Mapear IncidentResponseInterface -> IncidentInterface para o formulário
          this.incident = {
            id: incident.id ? Number(incident.id) : undefined,
            title: incident.title,
            service: incident.service,
            severity: incident.severity,
            status: incident.status,
            startedAt: incident.startedAt ? new Date(incident.startedAt).toISOString() : new Date().toISOString(),
            endedAt: incident.endedAt ? new Date(incident.endedAt).toISOString() : null,
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
      id: 0, // ID temporário, será definido pelo serviço
      title: '',
      service: '',
      severity: SeverityEnum.SEV_3, // Valor padrão
      status: StatusEnum.OPEN,
      startedAt: new Date().toISOString(), // Data e hora atual
      endedAt: null,
      impactShort: ''
    };
  }

  onSubmit(): void {
    this.incidentService.createIncident(this.incident).subscribe(() => {
      // Após salvar, navega de volta para a lista de incidentes
      this.router.navigate(['/incidents']);
    });
  }

  onCancel(): void {
    this.router.navigate(['/incidents']);
  }
}
