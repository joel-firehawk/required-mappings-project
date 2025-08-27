import pkg from 'twig';
const { twig } = pkg;

// --- 1. Proxy tracker (basic version) ------------------
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

// --- 1b. Track access ------------------
function trackTwigAccess(renderFn, rootVars) {
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

  console.error = originalError; // restore logging

  return [...tracker].filter(
    p => !p.endsWith(".then") &&
         !p.endsWith(".toString") &&
         !p.endsWith(".valueOf")
  );
}



// --- 2. Mapping resolver (stub) ------------------------
async function resolveMappings(paths, mappings, rootData) {
  // paths: ["client.branch.name", "client.invoices[].total.amount", ...]
  // mappings: your big JSON config
  // rootData: root entity with IDs, e.g. { client: { id: "123" } }

  const resolved = { ...rootData };

  for (const path of paths) {
    const [root, ...segments] = path.split('.');
    if (!resolved[root]) continue;


    // Simplified pseudo-code:
    let mapping = mappings[root];
    let obj = resolved[root];
    for (const seg of segments) {
      if (!obj) break;

      const m = mapping?.[seg];
      if (m?.location) {
        const id = obj[seg];
        if (typeof id === 'string') {
          // fetch the entity
          obj[seg] = await fetchEntity(m.location, id);
        }
        mapping = m.runMapping ? mappings[m.runMapping] : null;
      } else {
        mapping = mapping?.[seg];
        obj = obj[seg];
      }
    }
  }

  return resolved;
}

// Dummy Firestore fetch
async function fetchEntity(location, id) {
  console.log(`Fetching from ${location} id=${id}`);
  return { id, name: `Fetched ${id}` }; // stub
}

// --- 3. Full export pipeline ---------------------------
async function exportDocument(templateString, rootData, mappings) {
  const twigTemplate = twig({ data: templateString });

  // Pass 1: discovery with proxies
  const usedPaths = trackTwigAccess(
    (vars) => twigTemplate.render(vars),
    rootData
  );
  console.log("Used paths:", usedPaths);

  // Pass 2: fetch only what’s needed
  const data = await resolveMappings(usedPaths, mappings, rootData);

  // Pass 3: real render with actual data
  const html = twigTemplate.render(data);

  return html; // later convert to PDF
}

// --- Example usage -------------------------------------
const template = `
  {% set branch = client.branch %}
  Client: {{ client.name }}
  Branch: {{ branch.name }}
`;

const rootData = {
  client: { id: "c1", name: "Joe", branch: "b1" }
};

const mappings = {
  client: {
    branch: {
      location: "suppliers/list/",
      runMapping: "branch"
    }
  },
  branch: {} // could have parentBranch mapping, etc.
};

exportDocument(template, rootData, mappings).then(html => {
  console.log("\nFinal Render:\n", html);
});
