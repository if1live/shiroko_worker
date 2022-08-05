ARG BUILDER_IMAGE="denoland/deno:debian-1.24.1"
ARG RUNNER_IMAGE="denoland/deno:alpine-1.24.1"

# deno는 ts를 직접 실행할수 있으나 메모리 256MB에서는 OOM으로 터질 가능성이 높다
# 그래서 multi-stage로 구성해서 js로 빌드한 결과물만 배포에서 사용한다
FROM ${BUILDER_IMAGE} as builder

WORKDIR /app/hello-deno

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally cache deps.ts will download and compile _all_ external files used in main.ts.
COPY packages/hello-deno/deps.ts .
RUN deno cache deps.ts

COPY packages/hello-deno /app/hello-deno

# These steps will be re-run upon each file change in your working directory:
ADD packages/hello-deno/ .
# Compile the main app so that it doesn't need to be compiled each startup/entry.
RUN deno cache worker.ts

RUN deno bundle worker.ts bundle.js

FROM ${RUNNER_IMAGE}

WORKDIR "/app"

RUN chown nobody /app

# Only copy the final release from the build stage
COPY --from=builder --chown=nobody:root /app/hello-deno/bundle.js ./hello_deno.js

CMD ["run", "-A", "--unstable", "hello_deno.js"]
