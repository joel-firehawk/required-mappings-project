function wrapIfObject(value, path, tracker) {
  if (value !== null && typeof value === "object") {
    return new Proxy(value, {
      get(target, prop) {
        if (typeof prop === "symbol") return target[prop];

        const newPath = path ? `${path}.${prop}` : prop;
        tracker.add(newPath);

        const subValue = target[prop];
        return wrapIfObject(subValue, newPath, tracker);
      },
      has: () => true,
      ownKeys: () => Reflect.ownKeys(value),
      getOwnPropertyDescriptor: () => ({
        enumerable: true,
        configurable: true
      })
    });
  }
  return value;
}


export function createTrackingProxy(path, tracker) {
  return new Proxy({}, {
    get(_target, prop) {
      if (typeof prop === "symbol") return undefined;

      const newPath = path ? `${path}.${prop}` : prop;
      tracker.add(newPath);
      return createTrackingProxy(newPath, tracker);
    },
    has: () => true,
    ownKeys: () => []
  });
}


export function trackTwigAccess(renderFn, rootVars = {}) {
  const tracker = new Set();

  // Wrap existing rootVars with tracking
  const proxiedVars = new Proxy(rootVars, {
    get(target, prop) {
      if (typeof prop === "symbol") return target[prop];

      if (!(prop in target)) {
        target[prop] = createTrackingProxy(prop, tracker);
      }

      const value = target[prop];
      return wrapIfObject(value, prop, tracker);
    }
  });

  const originalError = console.error;
  console.error = () => {}; // silence Twig coercion errors

  try {
    renderFn(proxiedVars);
  } catch {
    // ignore errors during discovery
  }

  console.error = originalError;

  return [...tracker].filter(
    p =>
      !p.endsWith(".then") &&
      !p.endsWith(".toString") &&
      !p.endsWith(".valueOf") &&
      !p.endsWith("length") &&
      !p.endsWith("forEach") &&
      !p.endsWith("includes") &&
      !p.endsWith("indexOf") &&
      !p.endsWith(".0") &&
      !p.endsWith(".1") &&
      !p.endsWith(".id") &&
      !p.endsWith("tags") &&
      !p.includes("._keys")
  );
}
