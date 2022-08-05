import { R } from "./deps.ts";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
  ScheduledHandler,
  SNSHandler,
  SQSHandler,
} from "https://deno.land/x/lambda@1.23.4/mod.ts";
import { app } from "./app.ts";
import * as settings from "../settings.ts";

export async function handle_http(
  event: APIGatewayProxyEventV2,
  _context: Context,
): Promise<APIGatewayProxyResultV2> {
  const http = event.requestContext.http;

  const headers: HeadersInit = {};
  for (const [key, value] of Object.entries(event.headers)) {
    if (value !== undefined) {
      headers[key] = value;
    }
  }

  if (event.body) {
    headers["content-length"] = event.body.length.toString();
  }

  const body = http.method == "GET" || http.method == "HEAD"
    ? undefined
    : event.body;

  const host = "http://127.0.0.1";
  const endpoint = `${host}${http.path}`;
  const req = new Request(endpoint, {
    method: http.method,
    headers: headers,
    body: body,
  });

  const resp = await app.handle(req);
  if (!resp) {
    throw new Error("no response");
  }

  return {
    body: await resp.text(),
    headers: Object.fromEntries(resp.headers.entries()),
    statusCode: resp.status,
  };
}

// deno-lint-ignore require-await
export const handle_topic: SNSHandler = async (event, _context) => {
  console.log("topic", JSON.stringify(event, null, 2));
};

// deno-lint-ignore require-await
export const handle_queue: SQSHandler = async (event, _context) => {
  console.log("queue", JSON.stringify(event, null, 2));
};

// deno-lint-ignore require-await
export const handle_schedule: ScheduledHandler = async (event, _context) => {
  console.log("schedule", JSON.stringify(event, null, 2));
};

export const example_queue_dialogue: SQSHandler = async (_event, _context) => {
  // TODO: 환경변수보다 더 좋은 형태? 가입된 유저 + db?
  const apiToken = settings.TELEGRAM_API_TOKEN;
  const chatId = settings.TELEGRAM_CHAT_ID;

  const candidates = [
    "아비도스 대책위원회 2학년 스나오오카미 시로코야. 잘 부탁해.",
    "하고 싶은 게 있으면 뭐든 말해.",
    "어서와, 선생님. 오늘도 잘 부탁해.",
    "선생님을 돕기 위해 여기 있어.",
    "이렇게 함께 있는 것도 나쁘지 않네.",
    "(왜 그렇게 빤히 보는 거야?) ⋯저기, 내 얼굴에 뭐 묻었어? 에, 그냥 얼굴을 보고 싶었을 뿐이라고? ⋯그, 그래.",
    "시킬 거라도 있어?",
    "(무슨 생각을 하는지 궁금해.)",
    "(이제 뭘 하려는 걸까…?)",
    "선생님을 돕기 위해 여기 있는 거니까.",
    "그, 그렇게 쓰다듬으면… 딱히 곤란하진 않지만…",
  ];
  const idx = Math.floor(Math.random() * candidates.length);
  const text = candidates[idx];
  const encodedText = encodeURI(text);

  const url =
    `https://api.telegram.org/bot${apiToken}/sendMessage?chat_id=${chatId}&text=${encodedText}`;
  const _resp = await fetch(url);
};

export function handle_lambda(
  event: Record<string, unknown>,
  _context: Context,
) {
  console.log("lambda", JSON.stringify(event, null, 2));
  return Promise.resolve({ ts: Date.now() });
}
