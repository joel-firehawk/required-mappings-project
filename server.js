import fs from "fs";
import pkg from "twig";
import { trackTwigAccess } from "./tracker.js";

const { twig } = pkg;

const templateString = fs.readFileSync("./template.twig", "utf-8");
const twigTemplate = twig({ data: templateString });

const usedPaths = trackTwigAccess(vars => twigTemplate.render(vars));

console.log("Variables used in template:", usedPaths);
