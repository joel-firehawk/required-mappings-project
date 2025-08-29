import fs from "fs";
import pkg from "twig";
import { trackTwigAccess } from "./tracker.js";

const { twig } = pkg;

// Load template file from disk
const templateString = fs.readFileSync("./template.twig", "utf-8");

// Compile the twig template once
const twigTemplate = twig({ data: templateString });

// Provide root keys that exist in your template
const rootData = { client: {}, invoice: {}, event: {} };

// Run access discovery
const usedPaths = trackTwigAccess(
  (vars) => twigTemplate.render(vars),
  rootData
);

console.log("Variables used in template:", usedPaths);
