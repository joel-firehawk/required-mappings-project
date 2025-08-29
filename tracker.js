export function createTrackingProxy(path, tracker) {
  const proxy = new Proxy({}, {
    get(_target, prop) {
      if (typeof prop === "symbol") return undefined;

      const newPath = path ? `${path}.${prop}` : prop;
      tracker.add(newPath);
      return createTrackingProxy(newPath, tracker);
    },
    has: () => true,
    ownKeys: () => []
  });

  proxy[Symbol.toPrimitive] = () => "";
  proxy.toString = () => "";
  proxy.valueOf = () => "";
  proxy.toJSON = () => "";

  return proxy;
}

export function trackTwigAccess(renderFn, rootVars = {}) {
  const tracker = new Set();

  // Auto-proxy unknown roots
  const proxiedVars = new Proxy({ ...rootVars }, {
    get(target, prop) {
      if (typeof prop === "symbol") return undefined;
      if (!(prop in target)) {
        target[prop] = createTrackingProxy(prop, tracker);
      }
      return target[prop];
    }
  });

  const originalError = console.error;
  console.error = () => {}; // temporarily silence Twig coercion errors

  try {
    renderFn(proxiedVars);
  } catch {
    // Ignore during discovery phase
  }

  console.error = originalError; // restore logging

  return [...tracker].filter(
    p => !p.endsWith(".then") &&
         !p.endsWith(".toString") &&
         !p.endsWith(".valueOf")
  );
}