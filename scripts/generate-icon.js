const sharp = require('sharp');
const { default: pngToIco } = require('png-to-ico');
const fs = require('fs');
const path = require('path');

async function main() {
  const root = path.join(__dirname, '..');
  const svg = fs.readFileSync(path.join(root, 'icon.svg'));
  const buildDir = path.join(root, 'build');
  fs.mkdirSync(buildDir, { recursive: true });

  // 生成 256x256 PNG
  const png256 = await sharp(svg).resize(256, 256).png().toBuffer();
  fs.writeFileSync(path.join(buildDir, 'icon.png'), png256);

  // 生成各尺寸 PNG 并合成 .ico
  const sizes = [16, 32, 48, 64, 128, 256];
  const bufs = await Promise.all(
    sizes.map(s => sharp(svg).resize(s, s).png().toBuffer())
  );
  const ico = await pngToIco(bufs);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);

  console.log('✅ 图标已生成: build/icon.png + build/icon.ico');
}

main().catch(err => { console.error(err); process.exit(1); });
