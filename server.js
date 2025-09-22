import fs from "fs";
import pkg from "twig";
import { trackTwigAccess } from "./tracker.js";

const { twig } = pkg;

// Load the template file
let templateString = fs.readFileSync("./templates/template.twig", "utf-8");

// Adjust template to make it readable 
// creating a default object so it isn't empty when proxy tries to access it
templateString = templateString.replace(
    /{%-*\s*set\s+(\w+)\s*=\s*\[\]\s*-*%}/g,
    '{%- set $1 = [] | default([]) -%}'
);
// replacing standard for loop with set
templateString = templateString.replace(
    /{%-*\s*for\s(\w+)\sin\s([\w\.]+).*-*%}/g, 
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
// forcing if statements to be true if not checking objects
templateString = templateString.replace(
    /{%-*\s*if\s[\w]+\s[\w\s.<>?!=()]+-*%}/g, 
    '{%- if true -%}'
);
// forcing elseif statements to be true if not checking objects
templateString = templateString.replace(
    /{%-*\s*elseif\s[\w]+\s[\w\s.<>?!=()]+-*%}/g, 
    '{%- elseif true -%}'
);
// removing conditions from if statements
templateString = templateString.replace(
    /{%-*\s*if\s([\w\.]+)\s[\w\s.<>?!=()]+-*%}/g, 
    '{%- if $1 -%}'
);
// removing conditions from elseif statements
templateString = templateString.replace(
    /{%-*\s*elseif\s([\w\.]+)\s[\w\s.<>?!=()]+-*%}/g, 
    '{%- elseif $1 -%}'
);

// Log updated template
console.log(templateString)

// Compile template with Twig
const twigTemplate = twig({ data: templateString });

// Track which variables are accessed during rendering
const usedPaths = trackTwigAccess(vars => twigTemplate.render(vars));

// Log results
console.log("Variables used in template:", usedPaths);