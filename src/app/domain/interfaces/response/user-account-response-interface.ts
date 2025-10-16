import {ProviderEnum} from '../../enums/provider-enum';

export interface UserAccountResponseInterface {
  id: string;
  provider: ProviderEnum;
  externalId: string;
  email: string;
  name: string;
  pictureUrl: string;
  active: boolean;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
