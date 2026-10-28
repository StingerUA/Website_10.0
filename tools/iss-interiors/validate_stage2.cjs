const fs = require('node:fs');
const validator = require('gltf-validator');
(async () => {
  const reports = [];
  for (const file of process.argv.slice(2)) {
    const bytes = fs.readFileSync(file);
    const result = await validator.validateBytes(new Uint8Array(bytes), {uri: file});
    const jsonLength = bytes.readUInt32LE(12);
    const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
    if (!gltf.materials.some(m => m.occlusionTexture)) throw Error(`Missing AO: ${file}`);
    if (!gltf.materials.some(m => m.normalTexture)) throw Error(`Missing normal maps: ${file}`);
    const report = {file, bytes: bytes.length, errors: result.issues.numErrors, warnings: result.issues.numWarnings, messages: result.issues.messages};
    reports.push(report);
    console.log(JSON.stringify(report));
    if (report.errors || report.warnings) throw Error(`Invalid GLB: ${file}`);
  }
  if (process.env.ISS_VALIDATION_OUTPUT) fs.writeFileSync(process.env.ISS_VALIDATION_OUTPUT, JSON.stringify(reports, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
