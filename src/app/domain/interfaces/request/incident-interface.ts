import {SeverityEnum} from '../../enums/severity-enum';
import {StatusEnum} from '../../enums/status-enum';

export interface IncidentInterface {
  title: string;
  service: string;
  severity: SeverityEnum;
  status: StatusEnum;
  startedAt: Date;
  endedAt: Date;
  impactShort: string;
}
