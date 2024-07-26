import { FastifyInstance } from "fastify";
import { FromSchema } from "json-schema-to-ts";
import { MessageModel } from "./models/message.model";
import { sendMessage } from "./utils/kafka";
import { Logger } from "./utils/logger";

const createProductBody = {
  type: "object",
  properties: {
    text: { type: "string" },
  },
  required: ["text"],
} as const;

export async function routes(app: FastifyInstance) {
  app.post<{ Body: FromSchema<typeof createProductBody> }>(
    "/",
    {
      schema: {
        body: createProductBody,
      },
      preHandler: async (req, reply) => {
        try {
          await req.validateBody(createProductBody);
        } catch (error) {
          Logger.error('Validation error:', error);
          reply.status(400).send({ error: 'Invalid request data' });
        }
      },
    },
    async (req, reply) => {
      const { text } = req.body;

      try {
        const message = await MessageModel.create({ text });
        await sendMessage("message-created", JSON.stringify(message));
        return reply.code(201).send(message);
      } catch (error) {
        Logger.error('Error processing request:', error);
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );
}
