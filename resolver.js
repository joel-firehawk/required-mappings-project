import pkg from "twig";
import { trackTwigAccess } from "./tracker.js";
const { twig } = pkg;

// --- Mapping resolver ------------------------
export async function resolveMappings(paths, mappings, rootData) {
  const resolved = { ...rootData };

  for (const path of paths) {
    const [root, ...segments] = path.split('.');
    if (!resolved[root]) continue;

    let mapping = mappings[root];
    let obj = resolved[root];

    for (const seg of segments) {
      if (!obj) break;

      const m = mapping?.[seg];
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

  return resolved;
}

// Dummy Firestore fetch
async function fetchEntity(location, id) {
  console.log(`Fetching from ${location} id=${id}`);
  return { id, name: `Fetched ${id}` }; // stub
}

// --- Full export pipeline ---------------------------
export async function exportDocument(templateString, rootData, mappings) {
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

  return html;
}
