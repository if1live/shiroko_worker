import { Application, Router } from "./deps.ts";
import {
  DeleteConnectionCommand,
  ExecuteStatementCommand,
  GetConnectionCommand,
  PostToConnectionCommand,
  PublishCommand,
  SendMessageCommand,
} from "../sdk/mod.ts";
import { apigw, rds, sns, sqs } from "./instances.ts";
import { exampleRouter } from "./exampleRouter.ts";

export const app = new Application();

async function main_sqs() {
  const command = new SendMessageCommand({
    MessageBody: "hello world",
    QueueUrl: "queue-bar",
  });
  const result = await sqs.send(command);
  return result;
}

async function main_sns() {
  const command = new PublishCommand({
    Message: "MESSAGE_TEXT",
    TopicArn: "topic-foo",
  });
  const result = await sns.send(command);
  return result;
}

async function main_apigw() {
  const connectionId = "MkMpwZGPC9QdNieNhJYsM";
  {
    const command = new GetConnectionCommand({
      ConnectionId: connectionId,
    });
    const result1 = await apigw.send(command);
    console.log("apigw: getConnection", result1);
  }
  {
    const data = new Uint8Array(4);
    data[0] = 0x01;
    data[1] = 0x02;
    data[2] = 0x03;
    data[3] = 0x04;

    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: data,
    });
    const result = await apigw.send(command);
    console.log("apigw: postToConnection", result);
  }
  {
    const command = new DeleteConnectionCommand({
      ConnectionId: connectionId,
    });
    const result2 = await apigw.send(command);
    console.log("apigw: deleteConnection", result2);
  }
}

async function main_rds() {
  const command = new ExecuteStatementCommand({
    resourceArn: "sample-resourceArn",
    secretArn: "sample-secretArn",
    database: "sample-database",
    sql: "select $1::integer + $2::integer",
    parameters: [
      {
        name: "a",
        value: { longValue: 1 },
      },
      {
        name: "b",
        value: { longValue: 2 },
      },
    ],
  });
  const result = await rds.send(command);
  return result;
}

// Logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

const sampleRouter = new Router();
sampleRouter.get("/sample/env", async (ctx, next) => {
  ctx.response.body = Deno.env.toObject();
});
sampleRouter.get("/sample/sqs", async (ctx, next) => {
  const result = await main_sqs();
  ctx.response.body = result;
});
sampleRouter.get("/sample/sns", async (ctx, next) => {
  const result = await main_sns();
  ctx.response.body = result;
});
sampleRouter.get("/sample/rds", async (ctx, next) => {
  const result = await main_rds();
  ctx.response.body = result;
});

sampleRouter.get("/sample/queue-", async (ctx, next) => {
  const result = await main_rds();
  ctx.response.body = result;
});

app.use(sampleRouter.routes());
app.use(exampleRouter.routes());
