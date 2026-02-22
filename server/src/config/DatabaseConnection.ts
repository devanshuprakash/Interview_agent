import mongoose from "mongoose";

/**
 * DatabaseConnection — singleton wrapping the single Mongoose connection.
 * Guarantees exactly one connection for the process lifetime.
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection | undefined;
  private connected = false;

  private constructor(private readonly uri: string) {}

  static getInstance(uri: string): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(uri);
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    try {
      await mongoose.connect(this.uri);
      this.connected = true;
      console.log("Database Connected");
    } catch (error) {
      console.log(`Database Error ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await mongoose.disconnect();
    this.connected = false;
  }
}
