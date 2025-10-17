import {Component, OnInit} from '@angular/core';
import {IncidentResponseInterface} from '../../domain/interfaces/response/incident-response-interface';
import {IncidentService} from '../../services/incident-service';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-incident-list-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './incident-list-component.html',
  styleUrls: ['./incident-list-component.scss']
})
export class IncidentListComponent implements OnInit {

  allIncidents: IncidentResponseInterface[] = [];
  filteredIncidents: IncidentResponseInterface[] = [];

  // Opções para os filtros
  availableServices: string[] = [];
  // availableSeverities: Incident['severity'][] = ['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4'];
  // availableStatus: Incident['status'][] = ['OPEN', 'IN_ANALYSIS', 'CLOSED'];

  filters = {
    service: '',
    severity: '',
    status: ''
  };

  constructor(
    private incidentService: IncidentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadIncidents();
  }

  loadIncidents(): void {
    this.incidentService.getIncidents().subscribe((resp) => {
      const pageAny: any = resp as any;
      const data: IncidentResponseInterface[] = Array.isArray(pageAny)
        ? pageAny
        : (pageAny?.content ?? []);

      // Ordenação resiliente: tenta numérica por id; se não der, usa createdAt desc e, por fim, lexicográfica
      this.allIncidents = [...data].sort((a, b) => {
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
    });
  }

  populateFilterOptions(): void {
    const services = this.allIncidents.map(inc => inc.service);
    this.availableServices = [...new Set(services)]; // Pega serviços únicos
  }

  applyFilters(): void {
    let incidents = [...this.allIncidents];

    if (this.filters.service) {
      incidents = incidents.filter(inc => inc.service === this.filters.service);
    }
    if (this.filters.severity) {
      incidents = incidents.filter(inc => inc.severity === this.filters.severity);
    }
    if (this.filters.status) {
      incidents = incidents.filter(inc => inc.status === this.filters.status);
    }

    this.filteredIncidents = incidents;
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

  /**
   * Calcula o MTTR (Mean Time To Recovery) em um formato legível.
   */
  calculateMttr(incident: IncidentResponseInterface): string {
    if (!incident.endedAt) {
      return 'Em andamento';
    }
    const start = new Date(incident.startedAt).getTime();
    const end = new Date(incident.endedAt).getTime();
    const diffMs = end - start;

    if (diffMs < 0) return 'N/A';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    if (diffHours > 0) {
      return `${diffHours}h ${remainingMins}m`;
    }
    return `${remainingMins}m`;
  }

  // Funções para classes de estilo dinâmicas
  getSeverityClass(severity: IncidentResponseInterface['severity']): string {
    switch (severity) {
      case 'SEV-1': return 'bg-red-500 text-white';
      case 'SEV-2': return 'bg-orange-500 text-white';
      case 'SEV-3': return 'bg-yellow-400 text-gray-800';
      case 'SEV-4': return 'bg-blue-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  }

  getStatusClass(status: IncidentResponseInterface['status']): string {
    switch (status) {
      case 'Open': return 'bg-red-200 text-red-800 animate-pulse';
      case 'In Analysis': return 'bg-yellow-200 text-yellow-800';
      case 'Closed': return 'bg-green-200 text-green-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  }
}
