export function downloadConfig(content: string, filename = "config.yaml") {
  const blob = new Blob([content], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
