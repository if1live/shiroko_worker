import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";

const dotenv = config();
for (const [key, value] of Object.entries(dotenv)) {
  Deno.env.set(key, value);
}


// const origin_real = "https://shiroko.fly.dev";
const origin_internal = "http://shiroko.internal:8080";
const origin_localhost = "http://127.0.0.1:4000";

export const httpOrigin = Deno.env.get("FLY_APP_NAME")
  ? origin_internal
  : origin_localhost;

export const websocketOrigin = httpOrigin.startsWith("https://")
  ? httpOrigin.replace("https://", "wss://")
  : httpOrigin.replace("http://", "ws://");

export const credentials = {
  accessKeyId: Deno.env.get("SHIROKO_API_KEY") ?? "localAccessKeyId",
  secretAccessKey: Deno.env.get("SHIROKO_SECRET_KEY") ?? "localSecretAccessKey",
};

export const TELEGRAM_API_TOKEN = Deno.env.get("TELEGRAM_API_TOKEN");
export const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

export const FLY_ALLOC_ID: string | undefined = Deno.env.get("FLY_ALLOC_ID");
