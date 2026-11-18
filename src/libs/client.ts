import { Client } from "@notionhq/client";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const MIN_REQUEST_INTERVAL_MS = 400;
const MAX_CONCURRENT_REQUESTS = 2;
const MAX_RETRIES = 3;

let activeRequests = 0;
let waitingRequests: (() => void)[] = [];
let startQueue: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const getRetryAfterMilliseconds = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") return undefined;

  const apiError = error as {
    headers?: Headers | Record<string, string>;
    body?: string | { additional_data?: { retry_after?: number | string } };
    retry_after?: number | string;
  };

  const headerValue =
    apiError.headers instanceof Headers
      ? apiError.headers.get("retry-after")
      : apiError.headers?.["retry-after"];
  const headerSeconds = headerValue ? Number(headerValue) : undefined;

  let bodyRetryAfter: number | string | undefined;
  if (typeof apiError.body === "string") {
    try {
      bodyRetryAfter = JSON.parse(apiError.body).additional_data?.retry_after;
    } catch {
      bodyRetryAfter = undefined;
    }
  } else {
    bodyRetryAfter = apiError.body?.additional_data?.retry_after;
  }

  const retryAfterSeconds = Number(
    bodyRetryAfter ?? apiError.retry_after ?? headerSeconds,
  );
  return Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
    ? retryAfterSeconds * 1000
    : undefined;
};

const acquireRequestSlot = async (): Promise<void> => {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => waitingRequests.push(resolve));
  }
  activeRequests += 1;
};

const releaseRequestSlot = (): void => {
  activeRequests -= 1;
  waitingRequests.shift()?.();
};

const waitForRequestStart = async (): Promise<void> => {
  const previousStart = startQueue;
  let releaseStart!: () => void;
  startQueue = new Promise<void>((resolve) => {
    releaseStart = resolve;
  });

  await previousStart;
  try {
    const timeSinceLastRequest = Date.now() - lastRequestAt;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
      await sleep(MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest);
    }
    lastRequestAt = Date.now();
  } finally {
    releaseStart();
  }
};

export const notionRequest = async <T>(
  request: () => Promise<T>,
): Promise<T> => {
  await acquireRequestSlot();
  try {
    for (let attempt = 0; ; attempt += 1) {
      await waitForRequestStart();
      try {
        return await request();
      } catch (error) {
        const status =
          error && typeof error === "object"
            ? (error as { status?: number }).status
            : undefined;
        if (status !== 429 || attempt >= MAX_RETRIES) throw error;

        const retryAfter = getRetryAfterMilliseconds(error);
        await sleep(
          Math.max(
            retryAfter ?? MIN_REQUEST_INTERVAL_MS,
            MIN_REQUEST_INTERVAL_MS,
          ),
        );
      }
    }
  } finally {
    releaseRequestSlot();
  }
};
