

import { Kafka, logLevel, CompressionTypes, Producer, Message, Partitioners } from 'kafkajs';
import { Logger } from './logger';

const kafka = new Kafka({
  clientId: "messages-app",
  brokers: ["localhost:9092"],
  logLevel: logLevel.INFO,
  retry: {
    retries: 5,
    initialRetryTime: 300,
    factor: 2,
  },
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
  maxInFlightRequests: 5,
  idempotent: true,
});

export async function sendMessage(topic: string, message: any) {
  try {
    const kafkaMessage: Message = {
      value: message,
      headers: {
        'Content-Type': 'application/json',
      },
      compression: CompressionTypes.GZIP,
    };

    await producer.send({
      topic,
      messages: [kafkaMessage],
    });

    Logger.info(`Message sent to topic ${topic}`);
  } catch (error) {
    Logger.error(`Error sending message to topic ${topic}:`, error);

    // Optionally, handle retries or dead-letter queue logic here
    // For example: send to a dead-letter queue
  }
}

