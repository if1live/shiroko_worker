import { MyClient } from "../sdk/mod.ts";
import { credentials, httpOrigin } from "../settings.ts";

export const sqs = new MyClient({
  endpoint: `${httpOrigin}/runtime/queue/api`,
  credentials,
});

export const sns = new MyClient({
  endpoint: `${httpOrigin}/runtime/topic/api`,
  credentials,
});

export const apigw = new MyClient({
  endpoint: `${httpOrigin}/runtime/websocketapi/api`,
  credentials,
});

export const rds = new MyClient({
  endpoint: `${httpOrigin}/runtime/dataapi/api`,
  credentials,
});
