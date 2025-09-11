export const CATEGORIES = [
  { id: 'subscriptions', name: 'Abonnements & téléphonie', icon: '📱', color: '#8B5CF6' },
  { id: 'auto', name: 'Auto', icon: '🚗', color: '#3B82F6' },
  { id: 'other', name: 'Autres dépenses', icon: '📦', color: '#6B7280' },
  { id: 'gifts', name: 'Cadeaux & solidarité', icon: '🎁', color: '#EC4899' },
  { id: 'education', name: 'Éducation & famille', icon: '👨‍👩‍👧‍👦', color: '#10B981' },
  { id: 'taxes', name: 'Impôts & taxes', icon: '📋', color: '#DC2626' },
  { id: 'housing', name: 'Logement', icon: '🏠', color: '#CA8A04' },
  { id: 'leisure', name: 'Loisirs & sorties', icon: '🎭', color: '#F59E0B' },
  { id: 'cash', name: 'Retrait cash', icon: '💵', color: '#16A34A' },
  { id: 'health', name: 'Santé', icon: '⚕️', color: '#EF4444' },
  { id: 'services', name: 'Services financiers & professionnels', icon: '💼', color: '#1E40AF' },
  { id: 'daily', name: 'Vie quotidienne', icon: '🛒', color: '#059669' },
  { id: 'travel', name: 'Voyages', icon: '✈️', color: '#0EA5E9' },
  { id: 'savings', name: 'Savings', icon: '💰', color: '#84CC16' }
];

export function getCategoryById(id: string) {
  return CATEGORIES.find(category => category.id === id);
}

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find(category => category.id === slug);
}