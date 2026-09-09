import sharp from "sharp";
import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import PngToIco from "png-to-ico";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = join(__dirname, "..");
const distIconsDir = join(workspaceRoot, "dist", "icons");
const svgSourcePath = join(workspaceRoot, "public", "logo-annotation.svg");

async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory may already exist, ignore error
  }
}

async function generatePngIcons(sizes: number[]): Promise<string[]> {
  const tempFiles: string[] = [];

  for (const size of sizes) {
    console.log(`  Generating ${size}x${size} icon...`);
    const tempFile = join(workspaceRoot, `icon${size}.png`);
    tempFiles.push(tempFile);

    await sharp(svgSourcePath)
      .resize(size, size)
      .png()
      .toFile(tempFile);
  }

  return tempFiles;
}

async function generateIcoFile(pngFiles: string[]) {
  console.log("  Generating Windows ICO file...");
  const iconSizes = [256, 128, 64, 48, 32, 16];
  const icoPngFiles: string[] = [];

  for (const size of iconSizes) {
    const pngFile = pngFiles.find((f) => f.includes(`icon${size}.png`));
    if (pngFile) {
      icoPngFiles.push(pngFile);
    }
  }

  try {
    // 使用 png-to-ico 库生成标准的 ICO 文件
    const icoBuffer = await PngToIco(icoPngFiles);
    await fs.writeFile(join(distIconsDir, "win", "icon.ico"), icoBuffer);
    console.log("  ✅ ICO file generated successfully");
  } catch (error) {
    console.error("  ❌ Failed to generate ICO file:", error);
    throw error;
  }
}

// ICNS 文件格式生成器
class IcnsBuilder {
  private entries: { type: string; data: Buffer }[] = [];

  // ICNS 图标类型定义
  private static readonly ICON_TYPES = [
    { type: "icp4", size: 16 }, // 16x16
    { type: "icp5", size: 32 }, // 16x16 @2x
    { type: "ic08", size: 32 }, // 32x32
    { type: "ic09", size: 64 }, // 32x32 @2x
    { type: "ic11", size: 64 }, // 64x64
    { type: "ic12", size: 128 }, // 64x64 @2x
    { type: "ic13", size: 256 }, // 128x128 @2x
    { type: "ic14", size: 256 }, // 256x256
    { type: "ic15", size: 512 }, // 256x256 @2x
    { type: "ic10", size: 512 } // 512x512
  ];

  async addPngIcons(pngFiles: string[]) {
    for (const iconType of IcnsBuilder.ICON_TYPES) {
      const pngFile = pngFiles.find((f) => f.includes(`icon${iconType.size}.png`));
      if (pngFile) {
        try {
          const pngBuffer = await fs.readFile(pngFile);
          // 直接使用 PNG 数据作为 ICNS 的图像数据（ICNS 支持 PNG 格式）
          this.entries.push({ type: iconType.type, data: pngBuffer });
          console.log(`    Added ${iconType.size}x${iconType.size} (${iconType.type})`);
        } catch (error) {
          console.warn(`    Warning: Failed to process ${iconType.size}x${iconType.size}`, error);
        }
      }
    }
  }

  build(): Buffer {
    if (this.entries.length === 0) {
      throw new Error("No icons added to ICNS file");
    }

    // 计算总大小
    let totalSize = 8; // header: magic(4) + length(4)
    for (const entry of this.entries) {
      totalSize += 8 + entry.data.length; // type(4) + length(4) + data
    }

    // 写入 header
    const chunks: Buffer[] = [];
    const header = Buffer.alloc(8);
    header.write("icns", 0, "ascii");
    header.writeUInt32BE(totalSize, 4);
    chunks.push(header);

    // 写入每个 icon entry
    for (const entry of this.entries) {
      const entryHeader = Buffer.alloc(8);
      entryHeader.write(entry.type, 0, "ascii");
      entryHeader.writeUInt32BE(8 + entry.data.length, 4);
      chunks.push(entryHeader, entry.data);
    }

    return Buffer.concat(chunks);
  }
}

async function generateIcnsFile(pngFiles: string[]) {
  console.log("  Generating macOS ICNS file...");

  const builder = new IcnsBuilder();
  await builder.addPngIcons(pngFiles);
  const icnsBuffer = builder.build();

  await fs.writeFile(join(distIconsDir, "mac", "icon.icns"), icnsBuffer);
  console.log("  ✅ ICNS file generated successfully");
}

async function copyPngFiles(sizes: number[]) {
  console.log("  Generating Linux PNG files...");
  const pngOutputDir = join(distIconsDir, "png");

  for (const size of sizes) {
    const sourceFile = join(workspaceRoot, `icon${size}.png`);
    const targetFile = join(pngOutputDir, `${size}x${size}.png`);
    await fs.copyFile(sourceFile, targetFile);
  }
}

async function cleanupTempFiles(files: string[]) {
  console.log("  Cleaning up temporary files...");
  for (const file of files) {
    try {
      await fs.unlink(file);
    } catch (error) {
      // File may already be deleted, ignore error
    }
  }
}

try {
  console.log("🎨 Generating application icons...");

  // 创建图标目录
  await ensureDir(join(distIconsDir, "png"));
  await ensureDir(join(distIconsDir, "mac"));
  await ensureDir(join(distIconsDir, "win"));

  // 从 SVG 生成多尺寸 PNG 图标
  const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
  const tempFiles = await generatePngIcons(sizes);

  // 使用 png-to-ico 生成 Windows ICO 文件
  await generateIcoFile(tempFiles);

  // 使用自定义逻辑生成 macOS ICNS 文件
  await generateIcnsFile(tempFiles);

  // 复制 PNG 文件到目标目录
  await copyPngFiles(sizes);

  // 清理临时文件
  await cleanupTempFiles(tempFiles);

  console.log("✅ Icons generated successfully!");
} catch (error) {
  console.error("❌ Failed to generate icons:", error);
  process.exit(1);
}
