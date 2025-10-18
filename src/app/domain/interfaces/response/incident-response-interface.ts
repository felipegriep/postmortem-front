import {SeverityEnum} from '../../enums/severity-enum';
import {StatusEnum} from '../../enums/status-enum';
import {UserAccountResponseInterface} from './user-account-response-interface';

export interface IncidentResponseInterface {
    id: string;
    title: string;
    service: string;
    severity: SeverityEnum;
    status: StatusEnum;
    startedAt: Date;
    endedAt: Date;
    impactShort: string;
    reporter: UserAccountResponseInterface;
    createdAt: Date;
    updatedAt: Date;
}
