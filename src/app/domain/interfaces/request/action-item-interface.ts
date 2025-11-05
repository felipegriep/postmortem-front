import { ActionStatusEnum } from '../../enums/action-status-enum';
import { ActionTypeEnum } from '../../enums/action-type-enum';

export interface ActionItemInterface {
    type: ActionTypeEnum;
    description: string;
    ownerId: number;
    dueDate: string;
    status: ActionStatusEnum;
    evidenceLink?: string | null;
    completedAt?: string | null;
}
