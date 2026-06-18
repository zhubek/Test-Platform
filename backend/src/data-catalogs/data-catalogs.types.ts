import {
  Characteristic,
  CharacteristicGroup,
  DataCatalog,
  DataCatalogGroup,
} from '@prisma/client';

export type CatalogGroupEntity = DataCatalogGroup;
export type CatalogItemEntity = DataCatalog;
export type CharacteristicGroupEntity = CharacteristicGroup;
export type CharacteristicEntity = Characteristic;
