import fs from "fs";
import pkg from "twig";
import { trackTwigAccess } from "./tracker.js";

const { twig } = pkg;

let templateString = fs.readFileSync("./template.twig", "utf-8");
templateString = templateString.replace(/{%-*\s*set\s+(\w+)\s*=\s*\[\]\s*-*%}/g, '{%- set $1 = [] | default([]) -%}');
templateString = templateString.replace(/{%-?\s*for\s+(\w+)\s+in\s+([\w.]+)\s*-?%}/g, '{%- set $1 = $2.0|default({}) -%}');
templateString = templateString.replace(/{%-*\s*set\s+\w+\s=\s+\w+\|merge\((\w+)\)\s*-*%}/g, "{%- set _ = $1.var|default('') -%}");
templateString = templateString.replace(/ is(?: not)? empty(?= )/g, '');
templateString = templateString.replace(/{%-?\s*endfor\s*-?%}/g, '');
templateString = templateString.replace(/{%-*\s*if\s+hasTag\s+==\s+true\s*-*%}/g, '{%- if true -%}');
console.log(templateString)
const twigTemplate = twig({ data: templateString });

const usedPaths = trackTwigAccess(vars => twigTemplate.render(vars));

console.log("Variables used in template:", usedPaths);