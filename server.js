import fs from "fs";
import pkg from "twig";
import { trackTwigAccess } from "./tracker.js";

const { twig } = pkg;

// Load the template file
let templateString = fs.readFileSync("./templates/template.twig", "utf-8");

// Adjust template to make it readable 
// adding "| default([])"
templateString = templateString.replace(
    /{%-*\s*set\s+(\w+)\s*=\s*\[\]\s*-*%}/g,
    '{%- set $1 = [] | default([]) -%}'
);
// replacing standard for loop with set
templateString = templateString.replace(
    /{%-?\s*for\s+(\w+)\s+in\s+([\w.]+)\s*-?%}/g, 
    '{%- set $1 = $2.0|default({}) -%}'
);
templateString = templateString.replace(
    /{%-?\s*endfor\s*-?%}/g, ''
);
//
templateString = templateString.replace(
    /{%-*\s*set\s+\w+\s=\s+\w+\|merge\((\w+)\)\s*-*%}/g, 
    "{%- set _ = $1.var|default('') -%}"
);
// Removing "if [var] is not empty" statements
templateString = templateString.replace(
    / is(?: not)? empty(?= )/g, ''
);
// removed if statements checking "hasTag"
templateString = templateString.replace(
    /{%-*\s*if\s+hasTag\s+==\s+true\s*-*%}/g, 
    '{%- if true -%}'
);

// Log updated template
console.log(templateString)

// Compile template with Twig
const twigTemplate = twig({ data: templateString });

// Track which variables are accessed during rendering
const usedPaths = trackTwigAccess(vars => twigTemplate.render(vars));

// Log results
console.log("Variables used in template:", usedPaths);