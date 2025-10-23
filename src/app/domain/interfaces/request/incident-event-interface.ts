import { EventTypeEnum } from '../../enums/event-type-enum';

export interface IncidentEventInterface {
    eventAt: string;
    type: EventTypeEnum;
    description: string;
}
