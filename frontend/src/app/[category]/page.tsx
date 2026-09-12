import CategoryTemplate from '@/components/templates/notes/CategoryTemplate';
import { normalizeCategoryName } from '@/utils/category';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = (await params).category;
  const normalizedCategory = normalizeCategoryName(decodeURIComponent(category));
  return <CategoryTemplate key={normalizedCategory} category={normalizedCategory} />;
}
