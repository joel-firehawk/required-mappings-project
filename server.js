// index.js
import pkg from "twig";
import { trackTwigAccess } from "./tracker.js";

const { twig } = pkg;

// Example Twig template
const template = `
  {% set branch = client.branch %}
  Client: {{ client.name }}
  Branch: {{ branch.name }}
  Stock item: {{ invoice.fStock.stock.name }}
`;

// Top-level entities
const rootData = { client: {}, invoice: {}, event: {} };


// Compile Twig template
const twigTemplate = twig({ data: template });

// Discover used variables (no fetching/mapping, just paths)
const usedPaths = trackTwigAccess(
  (vars) => twigTemplate.render(vars),
  rootData
);

console.log("Variables used in template:", usedPaths);
