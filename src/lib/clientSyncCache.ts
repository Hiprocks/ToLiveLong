const RECORDS_PREFIX = "records:";

type CacheEntry = {
  data: unknown;
  dirty: boolean;
};

const cache = new Map<string, CacheEntry>();

export const cacheKeys = {
  records: (date: string) => `${RECORDS_PREFIX}${date}`,
  user: "user",
  templates: "templates",
};

export const getCachedData = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry || entry.dirty) return null;
  return entry.data as T;
};

export const setCachedData = <T>(key: string, data: T) => {
  cache.set(key, { data, dirty: false });
};

export const markCacheDirty = (key: string) => {
  const entry = cache.get(key);
  if (entry) {
    entry.dirty = true;
    return;
  }
  cache.set(key, { data: null, dirty: true });
};

export const markRecordCacheDirty = (date: string) => {
  markCacheDirty(cacheKeys.records(date));
};

export const markAllRecordCachesDirty = () => {
  for (const key of cache.keys()) {
    if (key.startsWith(RECORDS_PREFIX)) {
      markCacheDirty(key);
    }
  }
};
