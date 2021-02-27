const path = require('path');
const { promises: fs, constants } = require('fs');

const svgr = require('@svgr/core');

const HEROCIONS_PATH = path.join(process.cwd(), 'node_modules/heroicons');
const HEROCIONS_SOLID_PATH = path.join(HEROCIONS_PATH, 'solid');
const HEROCIONS_OUTLINE_PATH = path.join(HEROCIONS_PATH, 'outline');

const OUTDIR = path.join(process.cwd(), 'app/components/icons');
const OUTDIR_SOLID = path.join(OUTDIR, 'solid');
const OUTDIR_OUTLINE = path.join(OUTDIR, 'outline');

async function createDirIfNeeded(dir) {
  try {
    await fs.access(dir, constants.F_OK);
    return;
  } catch (error) {
    await fs.mkdir(dir);
  }
}

async function compileIcon(inputPath, outputDir) {
  const ext = path.extname(inputPath);
  const base = path.basename(inputPath, ext);
  const content = await fs.readFile(inputPath, 'utf-8');

  const jsx = await svgr.default(content, { icon: true, typescript: true });
  return fs.writeFile(path.join(outputDir, `${base}.tsx`), jsx);
}

async function compile() {
  // 1. verify all output directories exist
  await createDirIfNeeded(OUTDIR);
  await createDirIfNeeded(OUTDIR_SOLID);
  await createDirIfNeeded(OUTDIR_OUTLINE);

  // 2. get all svg icons from heroicons
  const [solid, outline] = await Promise.all([
    fs.readdir(HEROCIONS_SOLID_PATH),
    fs.readdir(HEROCIONS_OUTLINE_PATH),
  ]);

  // 3. generate icons
  await Promise.all([
    ...solid.map(icon =>
      compileIcon(path.join(HEROCIONS_SOLID_PATH, icon), OUTDIR_SOLID)
    ),
    ...outline.map(icon =>
      compileIcon(path.join(HEROCIONS_OUTLINE_PATH, icon), OUTDIR_OUTLINE)
    ),
  ]);
}

compile();
