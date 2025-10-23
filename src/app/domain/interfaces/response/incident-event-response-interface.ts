import { EventTypeEnum } from '../../enums/event-type-enum';
import { UserAccountResponseInterface } from './user-account-response-interface';

export interface IncidentEventResponseInterface {
    id: number;
    incidentId: number;
    eventAt: string; // date-time in ISO format
    type: EventTypeEnum;
    description: string;
    actor: UserAccountResponseInterface;
    createdAt: string;
    updatedAt: string;
}
