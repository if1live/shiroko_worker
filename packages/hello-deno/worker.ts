import { connect, HandlerDefinition } from "./sdk/mod.ts";
import { app } from "./handlers/app.ts";
import * as handlers from "./handlers/mod.ts";
import * as settings from "./settings.ts";

const functions: HandlerDefinition[] = [
  {
    handler: handlers.handle_topic,
    events: [
      { _tag: "sns", topicName: "topic-foo" },
    ],
  },
  {
    handler: handlers.handle_queue,
    events: [
      { _tag: "sqs", queueName: "queue-bar" },
    ],
  },
  {
    handler: handlers.example_queue_dialogue,
    events: [
      { _tag: "sqs", queueName: "queue-dialogue" },
    ],
  },
  {
    handler: handlers.handle_schedule,
    events: [
      {
        _tag: "scheudle",
        cron: "* * * * * *",
        input: {
          fun_name: "ping",
        },
      },
    ],
  },
  {
    handler: handlers.handle_http,
    events: [
      { _tag: "httpApi" },
    ],
  },
  {
    handler: handlers.handle_lambda,
    events: [
      { _tag: "lambda", subject: "foo" },
    ],
  },
];

// TODO: worker 인증 방식?
connect(settings.websocketOrigin, functions);

// 로컬 환경에서만 웹서버로도 작동하기. 그래야 웹훅 구현 쉬워서
if (settings.FLY_ALLOC_ID === undefined) {
  await app.listen({ port: 8080 });
}
