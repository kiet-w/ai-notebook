import CategoryTemplate from '@/components/templates/CategoryTemplate';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

function normalizeCategoryParam(param: string): string {
  const lowercase = param.toLowerCase();
  if (lowercase === 'cooking') return 'Cooking';
  if (lowercase === 'tech') return 'Tech';
  if (lowercase === 'learning') return 'Learning';
  if (lowercase === 'work') return 'Work';
  if (lowercase === 'finance') return 'Finance';
  if (lowercase === 'other') return 'Other';
  return param;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = (await params).category;
  const normalizedCategory = normalizeCategoryParam(category);
  return <CategoryTemplate key={normalizedCategory} category={normalizedCategory} />;
}
