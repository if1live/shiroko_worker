import { assertEquals } from "./test_deps.ts";
import { CloudEvent } from "./events.ts";

Deno.test("parse: example-0", () => {
  const json = `
{
  "specversion":"1.0",
  "type":"com.github.pull.create",
  "source":"https://github.com/cloudevents/spec/pull/123",
  "id":"b25e2717-a470-45a0-8231-985a99aa9416",
  "time":"2019-11-06T11:08:00Z",
  "subject":"example-subject",
  "datacontenttype":"application/json",
  "data":{
    "much":"wow"
  }
}
`;
  const payload = JSON.parse(json);
  const event = new CloudEvent(payload);

  assertEquals(event.specversion, payload["specversion"]);
  assertEquals(event.type, payload["type"]);
  assertEquals(event.source, payload["source"]);
  assertEquals(event.id, payload["id"]);
  assertEquals(event.time, payload["time"]);

  assertEquals(event.subject, payload["subject"]);

  assertEquals(event.datacontenttype, payload["datacontenttype"]);
  assertEquals(event.data, payload["data"]);
  assertEquals(event.extensions, {});

  const encoded = event.encode();
  assertEquals(encoded, payload);
});

Deno.test("parse: example-1", () => {
  const json = `
{
  "specversion":"1.0",
  "type":"com.github.pull.create",
  "source":"https://github.com/cloudevents/spec/pull/123",
  "id":"70d3c768-63f8-40e7-aa9d-d197d530586b",
  "time":"2019-11-06T11:08:00Z",
  "datacontenttype":"application/json",
  "data_base64":"eyJtdWNoIjoid293In0=",
  "myextension" : "something"
}
`;
  const payload = JSON.parse(json);

  const event = new CloudEvent(payload);

  assertEquals(event.specversion, payload["specversion"]);
  assertEquals(event.type, payload["type"]);
  assertEquals(event.source, payload["source"]);
  assertEquals(event.id, payload["id"]);
  assertEquals(event.time, payload["time"]);

  assertEquals(event.subject, undefined);

  assertEquals(event.datacontenttype, payload["datacontenttype"]);
  assertEquals(event.datacontentcencoding, "base64");
  assertEquals(event.data, payload["data_base64"]);

  assertEquals(event.extensions["myextension"], payload["myextension"]);

  const encoded = event.encode();
  assertEquals(encoded, payload);
});

Deno.test("parse: example-2", () => {
  const json = `
{
  "specversion":"1.0",
  "type":"com.github.pull.create",
  "source":"https://github.com/cloudevents/spec/pull/123",
  "id":"70d3c768-63f8-40e7-aa9d-d197d530586b",
  "time":"2019-11-06T11:08:00Z",
  "datacontenttype":"application/json",
  "data":{
    "much":"wow"
  },
  "myextension" : "something"
}
`;
  const payload = JSON.parse(json);
  const event = new CloudEvent(payload);

  assertEquals(event.specversion, payload["specversion"]);
  assertEquals(event.type, payload["type"]);
  assertEquals(event.source, payload["source"]);
  assertEquals(event.id, payload["id"]);
  assertEquals(event.time, payload["time"]);

  assertEquals(event.datacontenttype, payload["datacontenttype"]);
  assertEquals(event.data, payload["data"]);

  assertEquals(event.extensions["myextension"], payload["myextension"]);

  const encoded = event.encode();
  assertEquals(encoded, payload);
});
