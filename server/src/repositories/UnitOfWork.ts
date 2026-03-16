import mongoose, { type ClientSession } from "mongoose";

/**
 * UnitOfWork — thin wrapper around a Mongoose session.
 * Guarantees multi-repo writes (e.g., deduct credits + persist interview)
 * are atomic via a single MongoDB transaction.
 *
 * Pattern: Unit of Work.
 *
 * Usage:
 *   const uow = new UnitOfWork();
 *   await uow.run(async (session) => {
 *     await userRepo.decrementCredits(id, cost, session);
 *     await interviewRepo.createInterview(data, session);
 *   });
 */
export class UnitOfWork {
  async run<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await work(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      await session.endSession();
    }
  }
}
