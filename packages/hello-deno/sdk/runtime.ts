import { Socket } from "https://esm.sh/engine.io-client@6.2.2";
import { default as Logger } from "https://deno.land/x/logger@v1.0.0/logger.ts";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  Context,
  ScheduledEvent,
  SNSEvent,
  SQSEvent,
} from "https://deno.land/x/lambda@1.23.4/mod.ts";
import { CloudEvent } from "./events.ts";
import {
  HandlerDefinition,
  isAPIGatewayProxyEvent,
  isAPIGatewayProxyEventV2,
  isScheduledEvent,
  isSNSEvent,
  isSQSEvent,
  MyEvent,
} from "./types.ts";

const logger = new Logger();

export function connect(
  url: string,
  functions: HandlerDefinition[],
) {
  const socket = new Socket(url, {
    path: "/worker/ws",
    transports: ["websocket"],
    useNativeTimers: true,
  });

  function reconnect() {
    const now = new Date();
    logger.info(`try reconnect: ${now.toISOString()}`);
    connect(url, functions);
  }

  socket.on("open", () => {
    logger.info(`eio_open: id=${socket.id}`);
  });

  socket.on("close", (reason, _description) => {
    logger.info(`eio_close reason=${reason}`);

    // 새로운 서버가 배포되었는데 연결이 아직 안 끊어진듯?
    // 재접속하면 문제가 해결되지 않을까?
    if (reason === "ping timeout") {
      setTimeout(() => reconnect(), 10_000);
    }
  });

  socket.on("error", (error) => {
    logger.warn(`eio_error: ${JSON.stringify(error)}`);
    setTimeout(() => reconnect(), 10_000);
  });

  socket.on("message", (data) => {
    onmessage(data);
  });

  const onmessage_text = async (
    text: string,
  ) => {
    // TODO: 예외보다 더 좋은 물건을 써야 신뢰할수 있을듯
    try {
      const obj = JSON.parse(text);
      const event_input = new CloudEvent(obj);
      logger.info(`reactor_handle: ${event_input.id}`);

      const candidates = await filterFunctions(functions, event_input);
      if (candidates.length === 0) {
        throw new Error("no handler found");
      }

      // TODO: 더 멀쩡한 이벤트 해체
      // TODO: 핸들러중에는 void 리턴이 있는데 어떻게 대응하지?
      const context = {} as unknown as Context;
      const handler = candidates[0].handler;
      // deno-lint-ignore no-explicit-any
      const result = await handler(event_input.data as any, context);

      // TODO: 이벤트 생성하는 더 멀쩡한 방법?
      const now = new Date();
      const event_output = new CloudEvent({
        ...event_input.encode(),
        type: "com.shiroko.worker.invoke.response",
        source: "shiroko-worker",
        id: crypto.randomUUID(),
        time: now.toISOString(),
        data: result,
      });

      const frame = JSON.stringify(event_output.encode());
      socket.send(frame, {});
    } catch (e) {
      console.error(e);
    }
  };

  // deno-lint-ignore no-explicit-any
  const onmessage = async (data: any) => {
    try {
      if (typeof data === "string") {
        await onmessage_text(data);
      }
    } catch (e) {
      console.error(e);
    }
  };
}

function predicate_http(definition: MyEvent, _event: APIGatewayProxyEventV2) {
  if (definition.enabled === false) return false;
  if (definition._tag !== "httpApi") return false;
  return true;
}

function predicate_websocket(definition: MyEvent, event: APIGatewayProxyEvent) {
  if (definition.enabled === false) return false;
  if (definition._tag !== "websocket") return false;
  if (event.requestContext.routeKey !== definition.route) return false;
  return true;
}

function predicate_sqs(definition: MyEvent, event: SQSEvent) {
  if (definition.enabled === false) return false;
  if (definition._tag !== "sqs") return false;

  const arn = event.Records[0].eventSourceARN ?? "";
  if (arn !== definition.queueName) return false;

  return true;
}

function predicate_sns(definition: MyEvent, event: SNSEvent) {
  if (definition.enabled === false) return false;
  if (definition._tag !== "sns") return false;

  const arn = event.Records[0].EventSubscriptionArn ?? "";
  if (arn !== definition.topicName) return false;

  return true;
}

function predicate_schedule(definition: MyEvent, event: ScheduledEvent) {
  if (definition.enabled === false) return false;
  if (definition._tag !== "scheudle") return false;
  if (JSON.stringify(definition.input) !== JSON.stringify(event.detail)) {
    return false;
  }

  return true;
}

function predicate_lambda(definition: MyEvent, event: CloudEvent) {
  if (definition.enabled === false) return false;
  if (definition._tag !== "lambda") return false;
  if (definition.subject !== event.subject) {
    return false;
  }

  return true;
}

function filterFns_http(
  functions: HandlerDefinition[],
  event: APIGatewayProxyEventV2,
): HandlerDefinition[] {
  return functions.filter((definition) => {
    return definition.events.some((elem) => predicate_http(elem, event));
  });
}

function filterFns_websocket(
  functions: HandlerDefinition[],
  event: APIGatewayProxyEvent,
): HandlerDefinition[] {
  return functions.filter((definition) => {
    return definition.events.some((elem) => predicate_websocket(elem, event));
  });
}

function filterFns_sqs(
  functions: HandlerDefinition[],
  event: SQSEvent,
): HandlerDefinition[] {
  return functions.filter((definition) => {
    return definition.events.some((elem) => predicate_sqs(elem, event));
  });
}

function filterFns_sns(
  functions: HandlerDefinition[],
  event: SNSEvent,
): HandlerDefinition[] {
  return functions.filter((definition) => {
    return definition.events.some((elem) => predicate_sns(elem, event));
  });
}

function filterFns_schedule(
  functions: HandlerDefinition[],
  event: ScheduledEvent,
): HandlerDefinition[] {
  return functions.filter((definition) => {
    return definition.events.some((elem) => predicate_schedule(elem, event));
  });
}

function filterFns_lambda(
  functions: HandlerDefinition[],
  event: CloudEvent,
): HandlerDefinition[] {
  return functions.filter((definition) => {
    return definition.events.some((elem) => predicate_lambda(elem, event));
  });
}

function filterFunctions(
  functions: HandlerDefinition[],
  event: CloudEvent,
): HandlerDefinition[] {
  const payload = event.data;

  if (isSQSEvent(payload)) {
    return filterFns_sqs(functions, payload);
  } else if (isSNSEvent(payload)) {
    return filterFns_sns(functions, payload);
  } else if (isScheduledEvent(payload)) {
    return filterFns_schedule(functions, payload);
  } else if (isAPIGatewayProxyEventV2(payload)) {
    return filterFns_http(functions, payload);
  } else if (isAPIGatewayProxyEvent(payload)) {
    return filterFns_websocket(functions, payload);
  } else {
    return filterFns_lambda(functions, event);
  }
}
