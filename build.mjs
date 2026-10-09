import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const directory = dirname(fileURLToPath(import.meta.url));
const styles = readFileSync(join(directory, "styles.css"), "utf8").trim();
const page = readFileSync(join(directory, "page.html"), "utf8").trim();
const script = readFileSync(join(directory, "script.js"), "utf8").trim();

const title = "Oracle ERP Implementation in Lebanon & Iraq | Guardia";
const description = "Plan and implement Oracle Fusion Cloud ERP with Guardia Systems across Lebanon and Iraq. Connect finance, procurement, projects, data, and controls.";

const standalone = `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="description" content="${description}">
  <title>${title.replaceAll("&", "&amp;")}</title>
  <style>${styles}</style>
</head>
<body style="margin:0">
${page}
<script>${script}</script>
</body>
</html>
`;

const widget = `<!--
  Guardia Systems Oracle ERP landing page
  Paste this entire file into ONE Elementor HTML widget.
  Do not use an Elementor Text Editor widget.
-->
<style>${styles}</style>
${page}
<script>${script}</script>
`;

writeFileSync(join(directory, "index.html"), standalone);
writeFileSync(join(directory, "elementor-html-widget.html"), widget);

console.log("Built index.html and elementor-html-widget.html");
