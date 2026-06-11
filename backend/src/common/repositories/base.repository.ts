export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  constructor(protected readonly modelDelegate: any) {}

  async create(data: CreateInput): Promise<T> {
    return this.modelDelegate.create({ data });
  }

  async findAll(params: any = {}): Promise<T[]> {
    return this.modelDelegate.findMany(params);
  }

  async findById(id: string): Promise<T | null> {
    return this.modelDelegate.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return this.modelDelegate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return this.modelDelegate.delete({
      where: { id },
    });
  }
}
