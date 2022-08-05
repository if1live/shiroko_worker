export class CloudEvent {
  public readonly id: string;
  public readonly type: string;
  public readonly source: string;
  public readonly specversion: "1.0";
  public readonly datacontenttype?: string;
  public readonly datacontentcencoding?: string;
  public readonly subject?: string;
  public readonly time?: string;
  public readonly data: unknown | undefined;
  public readonly extensions: Record<string, unknown>;

  constructor(event: Record<string, unknown>) {
    const {
      id,
      type,
      source,
      specversion: _specversion,
      datacontenttype,
      subject,
      time,
      data: naive_data,
      data_base64: naive_data_base64,
      ...rest
    } = event;

    if (typeof id !== "string") throw new Error("id must be a string");
    this.id = id;

    if (typeof type !== "string") throw new Error("type must be a string");
    this.type = type;

    if (typeof source !== "string") throw new Error("source must be a string");
    this.source = source;

    this.specversion = "1.0";

    this.datacontenttype = datacontenttype as (string | undefined);

    this.subject = subject as (string | undefined);

    this.time = time as (string | undefined);

    let data: unknown | undefined = undefined;
    if (
      this.datacontenttype === "application/json" &&
      typeof naive_data === "object"
    ) {
      data = naive_data;
    }
    if (typeof naive_data_base64 === "string") {
      this.datacontentcencoding = "base64";
      data = naive_data_base64;
    }

    this.data = data;

    this.extensions = rest ?? {};
  }

  public encode(): Record<string, unknown> {
    const output: Record<string, unknown> = {
      id: this.id,
      type: this.type,
      source: this.source,
      specversion: this.specversion,
      datacontenttype: this.datacontenttype,
      subject: this.subject,
      time: this.time,
      ...this.extensions,
    };

    if (this.datacontentcencoding === "base64") {
      output.data_base64 = this.data;
    } else {
      output.data = this.data;
    }

    const entries = Object.entries(output).filter(([_key, value]) =>
      value !== undefined
    );
    return Object.fromEntries(entries);
  }
}
