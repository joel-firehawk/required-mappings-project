import fs from "fs";
import pkg from "twig";
import { trackTwigAccess } from "./tracker.js";

const { twig } = pkg;

let templateString = fs.readFileSync("./template.twig", "utf-8");
templateString = templateString.replace(/ is(?: not)? empty(?= )/g, '');
templateString = templateString.replace(/{%-?\s*for\s+(\w+)\s+in\s+([\w.]+)\s*-?%}/g, '{%- set $1 = $2.0 -%}');
templateString = templateString.replace(/{%-?\s*endfor\s*-?%}/g, '');
console.log(templateString)
const twigTemplate = twig({ data: templateString });

const usedPaths = trackTwigAccess(vars => twigTemplate.render(vars));

console.log("Variables used in template:", usedPaths);