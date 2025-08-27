import pkg from "twig";
const { twig } = pkg;


// Creates proxy for each new path (passing the path and tracker set which gets updated during every iteration)
function createTrackingProxy(path, tracker) {
    const proxy = new Proxy({}, {                               // Creates new proxy (empty object)
        get(_target, prop) {                                    // get method used to get either the next path or returns a prop
            if (typeof prop === "symbol") return undefined;     // if its not a variable (something like a javascript method), returns nothing
                                                
            const newPath = path ? `${path}.${prop}` : prop;    // if path exists, newPath will either equal the next path or the prop (if its the end of the path)
            tracker.add(newPath);                               // Update tracker set to include new path/prop

            return createTrackingProxy(newPath, tracker);       // recursively call function to go one deeper in path, passing the new path and tracker set
        },
        has: () => true,                                        // Always pretend the entity exists (if var exists will always return true)
        ownKeys: () => []                                       // Prevents Twig from looping over fake proxies with {% for ... %}
    });

    // Handle implicit conversions so Twig doesn't crash.
    // These ensure proxies behave like empty values when used as strings/numbers/JSON    proxy[Symbol.toPrimitive] = () => "";
    proxy.toString = () => "";
    proxy.valueOf = () => "";
    proxy.toJSON = () => "";

    // Finished ?
    return proxy;
}



// client.branch example

// 1
// prop = client
// add 'client' to tracker

// 2 client proxy
// path = client, prop = branch
// add 'client.branch' to tracker





function trackTwigAccess(renderFn, rootVars) {
    const tracker = new Set();                                  // Creates set to track unique paths

    const proxiedVars = {};                                     // creates empty object that will be used to store vars that have been proxied
    for (const key in rootVars) {                               // go through each root var
        proxiedVars[key] = createTrackingProxy(key, tracker);   // call create proxy function which will return the proxys for each var, these proxys will be stored in the proxiedVar object
    }

    const originalError = console.error;                        // create a temporary const for console error
    console.error = () => {};                                   // console error is empty so twig parsing errors are ignored

    try {
        renderFn(proxiedVars);                                  // Passes the proxied vars to the function where the twig template is rendered
    } catch {}

    console.error = originalError;                              // Reverts console error back to original version

    // returns tracker while filtering out javascript methods
    return [...tracker].filter(
        p => !p.endsWith(".then") &&
            !p.endsWith(".toString") &&
            !p.endsWith(".valueOf")
    );
}


async function resolvedMappings(path, mappings, rootData) {
    const resolved = { ...rootData };

    for (const path of paths) {
        const [root, ...rootData] = path.split('.');
        if (!resolved[root]) continue;

        let mapping = mappings[root];
        let obj = resolved[root];

        for (const seg of segments) {
            if (!obj) break;

            let m = mapping?.[seg];
            if (m?.location) {
                const id = obj[seg];
                if (typeof id === 'string') {
                    obj[seg] = await fetchEntity(m.location, id);
                }
                mapping = m.runMapping ? mappings[m.runMapping] : null;
            } else {
                mapping = mapping?.[seg];
                obj = obj[seg];
            }
        }
    }
}