import axios from "axios";

export const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

export const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
});

let hasLoggedApiUrl = false;

export function logApiUrl() {
  if (typeof window === "undefined" || hasLoggedApiUrl) {
    return;
  }

  hasLoggedApiUrl = true;
}

function normalizeApiError(error, fallbackMessage = "API error") {
  if (error?.response?.data) {
    const apiError = error.response.data;

    if (apiError.error) {
      error.message = apiError.error;
    }

    if (apiError.details) {
      error.details = apiError.details;
    }
  }

  if (!error?.message) {
    error.message = fallbackMessage;
  }

  return error;
}

async function request(method, url, config = {}, fallbackMessage = "API error") {
  logApiUrl();

  try {
    const response = await apiClient.request({
      method,
      url,
      ...config,
    });

    if (!response || response.status < 200 || response.status >= 300) {
      throw new Error(fallbackMessage);
    }

    return response.data;
  } catch (error) {
    throw normalizeApiError(error, fallbackMessage);
  }
}

export function safeGet(url, config, fallbackMessage) {
  return request("get", url, config, fallbackMessage);
}

export function safePost(url, data, config, fallbackMessage) {
  return request(
    "post",
    url,
    {
      ...config,
      data,
    },
    fallbackMessage,
  );
}

export function safePut(url, data, config, fallbackMessage) {
  return request(
    "put",
    url,
    {
      ...config,
      data,
    },
    fallbackMessage,
  );
}

export function safeDelete(url, config, fallbackMessage) {
  return request("delete", url, config, fallbackMessage);
}

const responseCache = new Map();
const inflightRequests = new Map();

function createCacheKey(url, params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          searchParams.append(key, String(item));
        });
        return;
      }

      searchParams.set(key, String(value));
    });

  const query = searchParams.toString();
  return query ? `${url}?${query}` : url;
}

export async function cachedGet(url, { params = {}, ttl = 60_000, force = false, headers } = {}) {
  const cacheKey = createCacheKey(url, params);
  const now = Date.now();

  if (!force) {
    const cached = responseCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const inflight = inflightRequests.get(cacheKey);

    if (inflight) {
      return inflight;
    }
  }

  const request = safeGet(
    url,
    {
      params,
      headers,
    },
    "API error",
  )
    .then((data) => {
      responseCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + ttl,
      });

      return data;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, request);

  return request;
}

export function clearCachedGet(prefix = "") {
  Array.from(responseCache.keys()).forEach((key) => {
    if (!prefix || key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  });

  Array.from(inflightRequests.keys()).forEach((key) => {
    if (!prefix || key.startsWith(prefix)) {
      inflightRequests.delete(key);
    }
  });
}
