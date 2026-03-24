/**
 * Command — base interface for all mutating interview operations.
 * Encapsulates request + execute() so commands can be logged, tested,
 * or queued uniformly. Pattern: Command.
 */
export interface ICommand<T = void> {
  execute(): Promise<T>;
}
