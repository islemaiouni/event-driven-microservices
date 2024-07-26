import { connectToDb } from "./utils/db";
import { connectProducer, disconnectFromKafka } from "./utils/kafka";
import { createServer } from "./utils/server";
import { Logger } from "./utils/logger";

async function gracefulShutdown(app: Awaited<ReturnType<typeof createServer>>) {
  try {
    Logger.info("Graceful shutdown initiated");

    await app.close();
    await disconnectFromKafka();

    process.exit(0);
  } catch (error) {
    Logger.error("Error during shutdown:", error);
    process.exit(1);
  }
}

async function main() {
  const app = createServer();

  try {
    await connectToDb();
    await connectProducer();

    app.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        Logger.error("Error starting server:", err);
        process.exit(1);
      }
      Logger.info(`Server listening at ${address}`);
    });

    const signals = ["SIGINT", "SIGTERM", "SIGQUIT"] as const;

    for (const signal of signals) {
      process.on(signal, () => {
        gracefulShutdown(app);
      });
    }
  } catch (error) {
    Logger.error("Error during application startup:", error);
    process.exit(1);
  }
}

main();
