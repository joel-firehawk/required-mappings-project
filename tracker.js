// Responsible for discovering which variables are used in a Twig template

function createTrackingProxy(path, tracker) {
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

export function trackTwigAccess(renderFn, rootVars) {
  const tracker = new Set();

  const proxiedVars = {};
  for (const key in rootVars) {
    proxiedVars[key] = createTrackingProxy(key, tracker);
  }

  const originalError = console.error;
  console.error = () => {}; // silence twig parse logs

  try {
    renderFn(proxiedVars);
  } catch {
    // ignore discovery errors entirely
  }

  console.error = originalError;

  return [...tracker].filter(
    p => !p.endsWith(".then") &&
         !p.endsWith(".toString") &&
         !p.endsWith(".valueOf")
  );
}
