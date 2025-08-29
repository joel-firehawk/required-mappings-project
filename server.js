import fs from "fs";
import pkg from "twig";
import { trackTwigAccess } from "./tracker.js";

const { twig } = pkg;

let templateString = fs.readFileSync("./test.twig", "utf-8");
templateString = templateString.replace(/ is(?: not)? empty(?= )/g, '');
console.log(templateString)
const twigTemplate = twig({ data: templateString });

// Run with seeded vars
const usedPaths = trackTwigAccess(vars => twigTemplate.render(vars));

console.log("Variables used in template:", usedPaths);
