import { SeverityEnum } from '../../enums/severity-enum';
import { StatusEnum } from '../../enums/status-enum';

export interface IncidentInterface {
    id?: number;
    title: string;
    service: string;
    severity: SeverityEnum;
    status: StatusEnum;
    startedAt: string;
    endedAt?: string | null;
    impactShort: string;
}
