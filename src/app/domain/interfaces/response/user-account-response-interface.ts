import { ProviderEnum } from '../../enums/provider-enum';

export interface UserAccountResponseInterface {
    id: number;
    provider: ProviderEnum;
    externalId: string;
    email: string;
    name: string;
    pictureUrl: string;
    active: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}
