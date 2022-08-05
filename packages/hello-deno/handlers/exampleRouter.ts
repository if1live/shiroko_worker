import { SendMessageCommand } from "../sdk/commands.ts";
import { Router } from "./deps.ts";
import { sqs } from "./instances.ts";

export const exampleRouter = new Router();

exampleRouter.post("/example/dialogue", async (ctx, next) => {
  const message = {};
  const command = new SendMessageCommand({
    MessageBody: JSON.stringify(message),
    QueueUrl: "queue-dialogue",
  });
  const result = await sqs.send(command);
  ctx.response.body = result;
});
