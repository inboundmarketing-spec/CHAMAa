export enum LocalGuidePlaceType {
  MARMITA = 'marmita',
  PHARMACY = 'pharmacy',
  HOSPITAL = 'hospital',
  FAST_FOOD = 'fast_food',
  SPORTS_SQUARE = 'sports_square',
  PARTY_VENUE = 'party_venue',
}

export enum LocalGuidePlaceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const LOCAL_GUIDE_TYPE_LABELS: Record<LocalGuidePlaceType, string> = {
  [LocalGuidePlaceType.MARMITA]: 'Marmita',
  [LocalGuidePlaceType.PHARMACY]: 'Farmácia',
  [LocalGuidePlaceType.HOSPITAL]: 'Hospital',
  [LocalGuidePlaceType.FAST_FOOD]: 'Fast Food',
  [LocalGuidePlaceType.SPORTS_SQUARE]: 'Praça esportiva',
  [LocalGuidePlaceType.PARTY_VENUE]: 'Local da festa',
};

export const ACCOMMODATION_GUIDE_TYPES = [
  LocalGuidePlaceType.MARMITA,
  LocalGuidePlaceType.PHARMACY,
  LocalGuidePlaceType.HOSPITAL,
  LocalGuidePlaceType.FAST_FOOD,
] as const;
