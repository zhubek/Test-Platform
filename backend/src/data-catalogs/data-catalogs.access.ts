import { createAccess } from '../common/access/create-access';
import { AuthUser, Relationship } from '../common/access/types';
import {
  CATALOG_ACTIONS,
  catalogGroupPolicy,
  catalogItemPolicy,
  characteristicGroupPolicy,
  characteristicPolicy,
} from './data-catalogs.policy';
import {
  CatalogGroupEntity,
  CatalogItemEntity,
  CharacteristicEntity,
  CharacteristicGroupEntity,
} from './data-catalogs.types';

/** Global content — no per-entity relationship. */
function none(_entity: unknown, _user: AuthUser): Relationship {
  return 'none';
}

export const {
  can: canGroup,
  capabilitiesFor: groupCapabilitiesFor,
} = createAccess<CatalogGroupEntity>({
  name: 'catalogGroup',
  policy: catalogGroupPolicy,
  actions: [...CATALOG_ACTIONS],
  relationshipTo: none,
  load: (db, id) => db.dataCatalogGroup.findUnique({ where: { id } }),
});

export const {
  can: canItem,
  capabilitiesFor: itemCapabilitiesFor,
} = createAccess<CatalogItemEntity>({
  name: 'catalogItem',
  policy: catalogItemPolicy,
  actions: [...CATALOG_ACTIONS],
  relationshipTo: none,
  load: (db, id) => db.dataCatalog.findUnique({ where: { id } }),
});

export const { capabilitiesFor: charGroupCapabilitiesFor } =
  createAccess<CharacteristicGroupEntity>({
    name: 'characteristicGroup',
    policy: characteristicGroupPolicy,
    actions: [...CATALOG_ACTIONS],
    relationshipTo: none,
    load: (db, id) => db.characteristicGroup.findUnique({ where: { id } }),
  });

export const { capabilitiesFor: charCapabilitiesFor } =
  createAccess<CharacteristicEntity>({
    name: 'characteristic',
    policy: characteristicPolicy,
    actions: [...CATALOG_ACTIONS],
    relationshipTo: none,
    load: (db, id) => db.characteristic.findUnique({ where: { id } }),
  });
