import { Prometheus } from 'prom-client';
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: "metrics-app",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: 'metrics-group' });

const messagesProcessed = new Prometheus.Counter({
  name: 'kafka_messages_processed_total',
  help: 'Total number of Kafka messages processed',
});

const errors = new Prometheus.Counter({
  name: 'kafka_errors_total',
  help: 'Total number of Kafka errors',
});

export async function startMetrics() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'metrics-topic', fromBeginning: true });

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          // Example: increment metrics counters
          messagesProcessed.inc();
        } catch (error) {
          errors.inc();
          Logger.error(`Metrics error:`, error);
        }
      },
    });

    Logger.info("Metrics consumer connected and listening");
  } catch (error) {
    Logger.error("Error starting metrics consumer:", error);
  }
}

export function getMetrics() {
  return Prometheus.register.metrics();
}


