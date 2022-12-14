import type {
  Credentials,
  ResponseMetadata,
} from "https://deno.land/x/aws_sdk@v3.32.0-1/types/mod.ts";
import type {
  ExecuteStatementCommandInput,
  ExecuteStatementCommandOutput,
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-rds-data/mod.ts";
import type {
  DeleteConnectionCommandInput,
  DeleteConnectionCommandOutput,
  GetConnectionCommandInput,
  GetConnectionCommandOutput,
  PostToConnectionCommandInput,
  PostToConnectionCommandOutput,
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-apigatewaymanagementapi/mod.ts";
import type {
  SendMessageBatchCommandInput,
  SendMessageBatchCommandOutput,
  SendMessageCommandInput,
  SendMessageCommandOutput,
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-sqs/mod.ts";
import type {
  PublishCommandInput,
  PublishCommandOutput,
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-sns/mod.ts";

/*
aws-sdk를 사용하고 싶은 이유
- 프로토콜을 바닥부터 다시 설계하고 싶지 않다
- aws-sdk는 웬만한 언어에는 다 있으니까 shiroko를 재사용하기 쉬울것이다

aws-sdk를 그대로 쓰지 않은 이유

1. aws-sdk v3을 그대로 끼워넣으니 deno에서는 번들 크기가 4MB로 뻥튀기된다
2. 게다가 aws-sdk는 node기준으로 구현되서 deno에서는 에러가 잔뜩 나온다.
(Deno.xxx를 덮어쓰면 우회할수 있다. deno-deploy 삽질한 흔적에 있음)
3. SQS는 응답 규격이 XML이고 apigateway api는 JSON이고,... aws api가 통일되지 않았다.
aws-sdk와 100% 똑같은거 만드는게 최종 목적이 아닌데 이런것까지 삽질해야 되나?

최종 목표
- aws-sdk의 타입 정보만 갖다쓴다
- aws-sdk v3오 인터페이스는 동일하게 유지한다
*/

interface ClientConfiguration {
  credentials: Credentials;
  endpoint: string;
}

type Method = "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS" | "PATCH";

export abstract class BaseCommand<TIn, TOut> {
  readonly __input_type!: TIn;
  readonly __output_type!: TOut;

  abstract get method(): Method;
  abstract get path(): string;

  constructor(public readonly input: TIn) {}
}

// rds data
export class ExecuteStatementCommand extends BaseCommand<
  ExecuteStatementCommandInput,
  ExecuteStatementCommandOutput
> {
  public get method(): Method {
    return "POST";
  }
  public get path() {
    return "/ExecuteStatement";
  }
}

// sqs
export class SendMessageCommand extends BaseCommand<
  SendMessageCommandInput,
  SendMessageCommandOutput
> {
  public get method(): Method {
    return "POST";
  }
  public get path() {
    return "/SendMessage";
  }
}

export class SendMessageBatchCommand extends BaseCommand<
  SendMessageBatchCommandInput,
  SendMessageBatchCommandOutput
> {
  public get method(): Method {
    return "POST";
  }
  public get path() {
    return "/SendMessageBatch";
  }
}

// sns
export class PublishCommand extends BaseCommand<
  PublishCommandInput,
  PublishCommandOutput
> {
  public get method(): Method {
    return "POST";
  }
  public get path() {
    return "/Publish";
  }
}

// api gateway management api
export class PostToConnectionCommand extends BaseCommand<
  PostToConnectionCommandInput,
  PostToConnectionCommandOutput
> {
  public get method(): Method {
    return "POST";
  }
  public get path() {
    return `/@connections/${this.input.ConnectionId}`;
  }
}

export class DeleteConnectionCommand extends BaseCommand<
  DeleteConnectionCommandInput,
  DeleteConnectionCommandOutput
> {
  public get method(): Method {
    return "DELETE";
  }
  public get path() {
    return `/@connections/${this.input.ConnectionId}`;
  }
}

export class GetConnectionCommand extends BaseCommand<
  GetConnectionCommandInput,
  GetConnectionCommandOutput
> {
  public get method() {
    return "GET" as const;
  }
  public get path() {
    return `/@connections/${this.input.ConnectionId}`;
  }
}

export class MyClient {
  constructor(private readonly config: ClientConfiguration) {}

  public async send<TIn, TOut>(
    command: BaseCommand<TIn, TOut>,
  ): Promise<TOut> {
    const path = command.path;
    const method = command.method;
    const url = `${this.config.endpoint}${path}`;

    const headers: HeadersInit = {};
    if (method !== "GET") {
      headers["Content-Type"] = "application/json";
      headers["x-api-key"] = this.config.credentials.accessKeyId;
      headers["x-secret-key"] = this.config.credentials.secretAccessKey;
    }

    let resp: Response;
    if (method === "GET") {
      // https://stackoverflow.com/a/49701878
      const params = new URLSearchParams(command.input as any);
      const qs = params.toString();

      resp = await fetch(`${url}?${qs}`, {
        method,
        headers,
        keepalive: true,
      });
    } else {
      resp = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(command.input),
        keepalive: true,
      });
    }

    const requestId = resp.headers.get("x-amzn-request-id");
    const metadata: ResponseMetadata = {
      requestId: requestId ?? undefined,
      httpStatusCode: resp.status,
    };

    const result = await resp.json();

    if (resp.status !== 200) {
      const data = { $metadata: metadata };
      return data as unknown as TOut;
    }

    const data = { ...result, $metadata: metadata };
    return data as unknown as TOut;
  }
}
