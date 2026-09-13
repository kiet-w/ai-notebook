export class CategoryResponseDto {
  id!: string;
  name!: string;
  key!: string | null;
  emoji!: string | null;
  isDefault!: boolean;
  userId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
