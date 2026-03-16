import type { Model, Document } from "mongoose";

// Mongoose 9 no longer re-exports FilterQuery / UpdateQuery at the top level.
// Loose shapes are fine here because the base repository is intentionally
// generic; concrete repositories use typed model methods directly.
export type AnyFilter = Record<string, unknown>;
export type AnyUpdate = Record<string, unknown>;

/**
 * BaseRepository<T> — template method over Mongoose.
 * Concrete repositories extend this and add domain-specific queries.
 * Services should never touch Mongoose directly.
 */
export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: AnyFilter): Promise<T | null> {
    return this.model.findOne(filter as never).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data as T);
  }

  async updateById(id: string, update: AnyUpdate): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(id, update as never, { new: true })
      .exec();
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
