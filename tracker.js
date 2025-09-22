/**
 * Wrap an object in a Proxy so we can track property access.
 * Any nested object access (a.b.c.d) will be recorded.
 *
 * @param {any} value - The value being wrapped
 * @param {string} path - The current path being tracked (e.g. "user.name")
 * @param {Set} tracker - Set collecting all accessed paths
 * @returns {any} - Either a proxied object or the original value
 */
function wrapIfObject(value, path, tracker) {
  if (value !== null && typeof value === "object") {
    return new Proxy(value, {
      get(target, prop) {
        if (typeof prop === "symbol") return target[prop];

        // Build the new path (e.g. "user.name")
        const newPath = path ? `${path}.${prop}` : prop;

        // Record the property access
        tracker.add(newPath);

        // Recurse into nested objects
        const subValue = target[prop];
        return wrapIfObject(subValue, newPath, tracker);
      },
      has: () => true,                         // Always report properties as existing
      ownKeys: () => Reflect.ownKeys(value),   // Ensure Object.keys works properly
      
      // Pretend all properties are enumerable/configurable
      getOwnPropertyDescriptor: () => ({
        enumerable: true,
        configurable: true
      })
    });
  }
  return value;
}


/**
 * Create a Proxy for "virtual" objects when a property doesn’t exist yet.
 * Useful for cases like vars.some.nested.property (auto-creates path).
 *
 * @param {string} path - Current path being tracked
 * @param {Set} tracker - Set collecting all accessed paths
 * @returns {Proxy} - A proxy that keeps expanding on property access
 */
export function createTrackingProxy(path, tracker) {
  return new Proxy({}, {
    get(_target, prop) {
      if (typeof prop === "symbol") return undefined;

      const newPath = path ? `${path}.${prop}` : prop;
      tracker.add(newPath);

      // Return another tracking proxy to allow infinite chaining
      return createTrackingProxy(newPath, tracker);
    },
    has: () => true,
    ownKeys: () => []
  });
}


/**
 * Run a Twig render function and capture which variables/paths are accessed.
 *
 * @param {Function} renderFn - Function that renders the Twig template
 * @param {Object} rootVars - Initial variables passed into the template
 * @returns {string[]} - List of accessed variable paths
 */
export function trackTwigAccess(renderFn, rootVars = {}) {
  const tracker = new Set();

  // Wrap existing rootVars with tracking
  const proxiedVars = new Proxy(rootVars, {
    get(target, prop) {
      if (typeof prop === "symbol") return target[prop];

      // If var not defined, create a "virtual" proxy for it
      if (!(prop in target)) {
        target[prop] = createTrackingProxy(prop, tracker);
      }

      const value = target[prop];
      return wrapIfObject(value, prop, tracker);
    }
  });

  // Silence Twig coercion errors (e.g., accessing undefined vars)
  const originalError = console.error;
  console.error = () => {}; 

  try {
    renderFn(proxiedVars);
  } catch {
    // Ignore template errors during variable discovery
  }

  // Restore error logging
  console.error = originalError;

  // Filter out unwanted responses
  return [...tracker].filter(
    p =>
      // starts with filters
      !p.startsWith("financialDocument") &&
      !p.startsWith("fDocument") &&
      !p.startsWith("allFinancialDocuments") &&
      !p.startsWith("fStock") &&

      // ends with filters - generic
      !p.endsWith(".var") &&
      !p.endsWith(".then") &&
      !p.endsWith(".toString") &&
      !p.endsWith(".valueOf") &&
      !p.endsWith(".length") &&
      !p.endsWith(".forEach") &&
      !p.endsWith(".includes") &&
      !p.endsWith(".indexOf") &&

      // unneccessary fields
      !p.endsWith(".0") &&
      !p.endsWith(".1") &&
      !p.endsWith(".id") &&
      !p.endsWith(".tags") &&
      !p.endsWith(".type") &&
      !p.endsWith(".eventType") &&
      !p.includes("._keys")
  );
}
