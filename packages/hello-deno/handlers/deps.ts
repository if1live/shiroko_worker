export { default as Logger } from "https://deno.land/x/logger@v1.0.0/logger.ts";

export * as R from "https://x.nest.land/rambda@7.1.4/mod.ts";

/*
web framework가 oak로 결정된 이유

1. 256MB램의 fly.io에서 돌아가야한다. SSR 제외. OOM 밟을 가능성 높으니까
2. 서버객체에 Request 객체를 직접 꽂을수 있어야한다.
serverless-http처럼 람다 이벤트를 받아서 Request객체로 바꿔서 서버에 밀어넣고 싶다
3. 당연히 로컬호스트에서 서버를 즉시 실행할 수 있어야한다

대부분의 deno web framework은 request객체를 직접 꽂는걸 지원하지 않더라.
*/
export { Application, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";

export type { Context } from "https://deno.land/x/lambda@1.23.4/mod.ts";
