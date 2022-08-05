import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyHandler,
  APIGatewayProxyHandlerV2,
  Handler,
  ScheduledHandler,
  SNSEvent,
  SNSHandler,
  SQSEvent,
  SQSHandler,
} from "https://deno.land/x/lambda@1.23.4/mod.ts";

type ExtractEvent<T> = T extends Handler<infer A, infer B> ? A : never;
export type ScheduledEvent = ExtractEvent<ScheduledHandler>;

export type MyHandler =
  | SQSHandler
  | SNSHandler
  | ScheduledHandler
  | APIGatewayProxyHandler
  | APIGatewayProxyHandlerV2
  // deno-lint-ignore no-explicit-any
  | Handler<any, any>;

export interface MyEvent_Lambda {
  _tag: "lambda";
  subject: string;
  enabled?: boolean;
}

export interface MyEvent_SQS {
  _tag: "sqs";
  queueName: string;
  enabled?: boolean;
}

export interface MyEvent_SNS {
  _tag: "sns";
  topicName: string;
  enabled?: boolean;
}

export interface MyEvent_Schedule {
  _tag: "scheudle";
  cron: string;
  input: Record<string, unknown>;
  enabled?: boolean;
}

export interface MyEvent_HTTP {
  _tag: "httpApi";
  enabled?: boolean;
}

export interface MyEvent_WebSocket {
  _tag: "websocket";
  route: "$connect" | "$disconnect" | "$default" | string;
  enabled?: boolean;
}

export type MyEvent =
  | MyEvent_Lambda
  | MyEvent_SQS
  | MyEvent_SNS
  | MyEvent_Schedule
  | MyEvent_HTTP
  | MyEvent_WebSocket;

export interface HandlerDefinition {
  handler: MyHandler;
  events: MyEvent[];
}

export function isSQSEvent(x: unknown): x is SQSEvent {
  const data = x as Partial<SQSEvent>;
  if (!data.Records) return false;
  if (data.Records.length === 0) return false;

  // 타입 검증은 하나만 봐도 충분할듯
  const record = data.Records[0];
  if (record.eventSource === "aws:sqs") return true;
  if (record.eventSource === "shiroko.queue") return true;

  return false;
}

export function isSNSEvent(x: unknown): x is SNSEvent {
  const data = x as Partial<SNSEvent>;
  if (!data.Records) return false;
  if (data.Records.length === 0) return false;

  const record = data.Records[0];
  if (record.EventSource === "aws:sns") return true;
  if (record.EventSource === "shiroko.topic") return true;

  return false;
}

export function isScheduledEvent(x: unknown): x is ScheduledEvent {
  const data = x as Partial<ScheduledEvent>;
  if (data["detail-type"] !== "Scheduled Event") return false;

  if (data.source === "aws.events") return true;
  if (data.source === "shiroko.cron") return true;

  return false;
}

export function isAPIGatewayProxyEventV2(
  x: unknown,
): x is APIGatewayProxyEventV2 {
  const data = x as Partial<APIGatewayProxyEventV2>;

  if (data.version !== "2.0") return false;
  if (!data.requestContext?.http) return false;

  return true;
}

export function isAPIGatewayProxyEvent(
  x: unknown,
): x is APIGatewayProxyEvent {
  // deno-lint-ignore no-explicit-any
  const data = x as any;

  // websocket api event도 잡아내려고 requestContext만 검증
  // http 속성으로 2.0인지 아닌지 확인한다
  if (!data.requestContext) return false;
  if (data.requestContext.http) return false;

  return true;
}
