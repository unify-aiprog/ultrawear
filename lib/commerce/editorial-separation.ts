export type CommercialLabel = 'editorial' | 'sponsored' | 'affiliate' | 'advertisement';

export interface CommercialMetadata {
  label: CommercialLabel;
  sponsor?: string;
  disclosure: string;
  editorialIndependence: true;
}

export function requireCommercialDisclosure(metadata: CommercialMetadata) {
  if (!metadata.disclosure.trim()) throw new TypeError('Commercial content requires a disclosure');
  if (metadata.label !== 'editorial' && metadata.editorialIndependence !== true) {
    throw new TypeError('Commercial content must preserve editorial independence');
  }
  return Object.freeze({ ...metadata });
}
