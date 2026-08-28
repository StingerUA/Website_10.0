import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

const [, , input, output] = process.argv;
if (!input || !output) {
  throw new Error('Usage: node scripts/decompress-tripo-glb.mjs input.glb output.glb');
}

const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const document = await io.read(input);
document.disposeExtension('EXT_meshopt_compression');
await io.write(output, document);
console.log(JSON.stringify({ input, output, meshes: document.getRoot().listMeshes().length }));
