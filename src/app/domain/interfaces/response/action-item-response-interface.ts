import { ActionStatusEnum } from '../../enums/action-status-enum';
import { ActionTypeEnum } from '../../enums/action-type-enum';
import { SlaInterface } from './sla-interface';
import { UserAccountResponseInterface } from './user-account-response-interface';

export interface ActionItemResponseInterface {
    id: number;
    incidentId: number;
    type: ActionTypeEnum;
    description: string;
    owner: UserAccountResponseInterface | null;
    dueDate: string;
    status: ActionStatusEnum;
    evidenceLink: string | null;
    completedAt: string | null;
    sla?: SlaInterface | null;
    createdAt: string;
    updatedAt: string;
}
