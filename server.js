import fs from "fs";
import pkg from "twig";
import { trackTwigAccess } from "./tracker.js";

const { twig } = pkg;

const templateString = fs.readFileSync("./template.twig", "utf-8");
const twigTemplate = twig({ data: templateString });

// Load a test client JSON as rootVars
const rootVars = JSON.parse(fs.readFileSync("./testClient.json", "utf-8"));

// Run with seeded vars
const usedPaths = trackTwigAccess(vars => twigTemplate.render(vars), rootVars);

console.log("Variables used in template:", usedPaths);
