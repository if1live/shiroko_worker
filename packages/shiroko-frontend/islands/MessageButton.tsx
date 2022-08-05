/** @jsx h */
import { h, Fragment } from "preact";
import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";

interface Props {
  origin: string;
}

export default function MessageButton(props: Props) {
  const { origin } = props;
  const [response, setResponse] = useState("");

  // TODO: 결국 swr같은거 써야하나?
  const clicked = async () => {
    const path = "/example/dialogue";
    const url = `${origin}${path}`;
    const resp = await fetch(url, {
      method: "POST",
    });

    const text = await resp.text();
    setResponse(text);
  };

  return (
    <Fragment>
      <Button onClick={clicked}>send message</Button>
      <pre>{response}</pre>
    </Fragment>
  )
}
