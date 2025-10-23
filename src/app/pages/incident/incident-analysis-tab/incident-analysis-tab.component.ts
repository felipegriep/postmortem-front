import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-incident-analysis-tab',
    standalone: true,
    imports: [CommonModule, MatCardModule],
    templateUrl: './incident-analysis-tab.component.html',
    styleUrls: ['./incident-analysis-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentAnalysisTabComponent {}
