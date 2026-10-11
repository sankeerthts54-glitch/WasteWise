import { DOMAINS, type DomainConfig } from 'wastewise-shared';

export interface DomainMeta {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  inputCount: number;
}

export const DOMAIN_METADATA: DomainMeta[] = DOMAINS.map((d: DomainConfig) => ({
  slug: d.slug,
  name: d.name,
  description: d.description,
  icon: d.slug === 'waste-segregation' ? '🗑️' :
        d.slug === 'ewaste-disposal' ? '🔌' :
        d.slug === 'recycling-upcycling' ? '♻️' : '☀️',
  category: d.category,
  inputCount: d.fields.length,
}));

export const getDomainMeta = (slug: string): DomainMeta | undefined =>
  DOMAIN_METADATA.find((m) => m.slug === slug);
