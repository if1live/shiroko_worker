/** @jsx h */
import { h } from "preact";
import Counter from "../islands/Counter.tsx";
import MessageButton from "../islands/MessageButton.tsx";

// https://deno.com/deploy/docs/projects#environment-variables
const origin_localhost = "http://127.0.0.1:4000/http";
const origin_real = "https://shiroko.fly.dev/http";

export default function Home() {
  return (
    <div>
      <img
        src="/logo.svg"
        height="100px"
        alt="the fresh logo: a sliced lemon dripping with juice"
      />
      <p>
        Welcome to `fresh`. Try updating this message in the ./routes/index.tsx
        file, and refresh.
      </p>
      <Counter start={3} />

      <div>
        real: <MessageButton origin={origin_real} />
      </div>
      <div>
        localhost: <MessageButton origin={origin_localhost} />
      </div>
    </div>
  );
}

