#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const defaultConfigName = 'industrial-splash.config.json'
const packageJson = JSON.parse(
  await fs.readFile(path.join(__dirname, 'package.json'), 'utf8'),
)

function printHelp() {
  console.log(`
industrial-splash v${packageJson.version}

用法：
  industrial-splash [options]

选项：
  --init                  初始化配置文件和 branding 目录
  --force                 配合 --init 覆盖已有文件
  -c, --config <path>     指定配置文件，默认 ./industrial-splash.config.json
  -t, --target <id>       直接指定目标分辨率，如 1280x800
  --logo <path>           临时覆盖 logo 图片路径
  --output-dir <path>     临时覆盖输出目录
  --android-res-dir <p>   额外导出到 Android res 目录
  -h, --help              显示帮助
  -v, --version           显示版本

示例：
  industrial-splash --init
  industrial-splash --config ../industrial-splash-workspace/industrial-splash.config.json --init
  industrial-splash --target 1280x800
  industrial-splash --config ../industrial-splash-workspace/industrial-splash.config.json --logo "C:/Users/name/Desktop/logo.png" --target 1280x800
  industrial-splash --target 1920x1080 --android-res-dir ./app/src/main/res
`.trim())
}

function parseArgs(argv) {
  let configPath = path.resolve(process.cwd(), defaultConfigName)
  let targetId = null
  let logoPath = null
  let outputDir = null
  let androidResDir = null
  let init = false
  let force = false
  let help = false
  let version = false

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if ((current === '--config' || current === '-c') && argv[index + 1]) {
      configPath = path.resolve(process.cwd(), argv[index + 1])
      index += 1
      continue
    }

    if ((current === '--target' || current === '-t') && argv[index + 1]) {
      targetId = argv[index + 1]
      index += 1
      continue
    }

    if (current === '--logo' && argv[index + 1]) {
      logoPath = path.resolve(process.cwd(), argv[index + 1])
      index += 1
      continue
    }

    if (current === '--output-dir' && argv[index + 1]) {
      outputDir = path.resolve(process.cwd(), argv[index + 1])
      index += 1
      continue
    }

    if (current === '--android-res-dir' && argv[index + 1]) {
      androidResDir = path.resolve(process.cwd(), argv[index + 1])
      index += 1
      continue
    }

    if (current === '--init') {
      init = true
      continue
    }

    if (current === '--force') {
      force = true
      continue
    }

    if (current === '--help' || current === '-h') {
      help = true
      continue
    }

    if (current === '--version' || current === '-v') {
      version = true
    }
  }

  return {
    configPath,
    targetId,
    logoPath,
    outputDir,
    androidResDir,
    init,
    force,
    help,
    version,
  }
}

function parseHexColor(hex) {
  const normalized = hex.trim().replace(/^#/, '')

  if (normalized.length === 6) {
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
      alpha: 1,
    }
  }

  if (normalized.length === 8) {
    return {
      alpha: Number.parseInt(normalized.slice(0, 2), 16) / 255,
      r: Number.parseInt(normalized.slice(2, 4), 16),
      g: Number.parseInt(normalized.slice(4, 6), 16),
      b: Number.parseInt(normalized.slice(6, 8), 16),
    }
  }

  throw new Error(`backgroundColor must use #RRGGBB or #AARRGGBB. Current value: ${hex}`)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

async function ensureDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function writeFileIfAllowed(filePath, content, force) {
  if (!force) {
    try {
      await fs.access(filePath)
      throw new Error(`File already exists: ${filePath}. Use --force to overwrite.`)
    }
    catch (error) {
      if (error && error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  await ensureDirectory(filePath)
  await fs.writeFile(filePath, content, 'utf8')
}

async function writeBuffer(outputPath, buffer) {
  await ensureDirectory(outputPath)
  await fs.writeFile(outputPath, buffer)
}

async function loadConfig(configPath) {
  const source = await fs.readFile(configPath, 'utf8')
  return JSON.parse(source)
}

async function getLogoMetadata(logoPath) {
  const metadata = await sharp(logoPath).metadata()
  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read logo dimensions: ${logoPath}`)
  }

  return {
    width: metadata.width,
    height: metadata.height,
  }
}

function getTargets(config) {
  const targets = Array.isArray(config.targets) ? config.targets : []

  if (targets.length === 0) {
    throw new Error('Config must contain at least one target.')
  }

  return targets.map((target) => ({
    id: String(target.id),
    label: String(target.label ?? `${target.width}x${target.height}`),
    width: Number(target.width),
    height: Number(target.height),
    render: target.render ?? {},
  }))
}

function findById(items, id) {
  return items.find((item) => item.id === id) ?? null
}

async function promptForTarget(targets) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Interactive target selection requires a TTY. Use --target to skip the prompt.')
  }

  console.log('请选择启动图分辨率：')
  targets.forEach((target, index) => {
    console.log(`${index + 1}. ${target.label}`)
  })

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    while (true) {
      const answer = (await rl.question(`请输入选项 [1-${targets.length}]：`)).trim()
      const selectedIndex = Number(answer)

      if (Number.isInteger(selectedIndex) && selectedIndex >= 1 && selectedIndex <= targets.length) {
        return targets[selectedIndex - 1]
      }

      console.log('输入无效，请重新输入对应序号。')
    }
  }
  finally {
    rl.close()
  }
}

async function resolveSelectedTarget(targets, requestedTargetId) {
  if (requestedTargetId) {
    const selectedTarget = findById(targets, requestedTargetId)
    if (!selectedTarget) {
      const validIds = targets.map((item) => item.id).join(', ')
      throw new Error(`Unknown target "${requestedTargetId}". Available targets: ${validIds}`)
    }

    return selectedTarget
  }

  if (targets.length === 1) {
    return targets[0]
  }

  return promptForTarget(targets)
}

function getRenderOptions(config, target) {
  const merged = {
    ...(config.renderDefaults ?? {}),
    ...(target.render ?? {}),
    width: target.width,
    height: target.height,
  }

  const width = Number(merged.width)
  const height = Number(merged.height)
  const logoMaxWidthRatio = Number(merged.logoMaxWidthRatio)
  const logoMaxHeightRatio = Number(merged.logoMaxHeightRatio)
  const offsetX = Number(merged.offsetX ?? 0)
  const offsetY = Number(merged.offsetY ?? 0)

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error('Target width/height must be numbers.')
  }

  if (!Number.isFinite(logoMaxWidthRatio) || !Number.isFinite(logoMaxHeightRatio)) {
    throw new Error('logoMaxWidthRatio and logoMaxHeightRatio must be numbers.')
  }

  return {
    width,
    height,
    logoMaxWidthRatio,
    logoMaxHeightRatio,
    offsetX,
    offsetY,
  }
}

async function renderSplashImage({ logoPath, logoMetadata, backgroundColor, renderOptions }) {
  const { width, height, logoMaxWidthRatio, logoMaxHeightRatio, offsetX, offsetY } = renderOptions
  const maxLogoWidth = Math.max(1, Math.round(width * logoMaxWidthRatio))
  const maxLogoHeight = Math.max(1, Math.round(height * logoMaxHeightRatio))
  const scale = Math.min(maxLogoWidth / logoMetadata.width, maxLogoHeight / logoMetadata.height)

  if (!(scale > 0)) {
    throw new Error('Failed to calculate logo scale. Check the source image size.')
  }

  const drawWidth = Math.max(1, Math.round(logoMetadata.width * scale))
  const drawHeight = Math.max(1, Math.round(logoMetadata.height * scale))
  const left = clamp(Math.round((width - drawWidth) / 2 + offsetX), 0, width - drawWidth)
  const top = clamp(Math.round((height - drawHeight) / 2 + offsetY), 0, height - drawHeight)

  const logoBuffer = await sharp(logoPath)
    .resize(drawWidth, drawHeight, {
      fit: 'fill',
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer()

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: backgroundColor,
    },
  })
    .composite([{ input: logoBuffer, left, top }])
    .png()
    .toBuffer()
}

function getOutputPaths(baseOutputDir, target, androidQualifier) {
  const targetOutputDir = path.join(baseOutputDir, target.id)
  const qualifiedDrawableDir = `drawable-${androidQualifier}-nodpi`

  return {
    previewPath: path.join(targetOutputDir, 'preview', 'splash.png'),
    localAndroidFallbackPath: path.join(targetOutputDir, 'android-res', 'drawable-nodpi', 'splash.png'),
    localAndroidQualifiedPath: path.join(targetOutputDir, 'android-res', qualifiedDrawableDir, 'splash.png'),
    qualifiedDrawableDir,
  }
}

async function exportToAndroidResDir({ androidResDir, qualifiedDrawableDir, buffer, writtenFiles }) {
  const fallbackPath = path.join(androidResDir, 'drawable-nodpi', 'splash.png')
  const qualifiedPath = path.join(androidResDir, qualifiedDrawableDir, 'splash.png')

  await writeBuffer(fallbackPath, buffer)
  await writeBuffer(qualifiedPath, buffer)

  writtenFiles.push(fallbackPath, qualifiedPath)
}

async function initProject(configPath, force) {
  const configTemplatePath = path.join(__dirname, 'templates', 'industrial-splash.config.json')
  const brandingTemplatePath = path.join(__dirname, 'templates', 'branding.README.txt')
  const configTemplate = await fs.readFile(configTemplatePath, 'utf8')
  const brandingTemplate = await fs.readFile(brandingTemplatePath, 'utf8')
  const workspaceDir = path.dirname(configPath)
  const brandingReadmePath = path.join(workspaceDir, 'branding', 'README.txt')

  await writeFileIfAllowed(configPath, configTemplate, force)
  await writeFileIfAllowed(brandingReadmePath, brandingTemplate, force)

  console.log('初始化完成：')
  console.log(` - ${configPath}`)
  console.log(` - ${brandingReadmePath}`)
}

async function main() {
  const { configPath, targetId, logoPath: logoOverridePath, outputDir: outputDirOverride, androidResDir, init, force, help, version } = parseArgs(process.argv.slice(2))

  if (help) {
    printHelp()
    return
  }

  if (version) {
    console.log(packageJson.version)
    return
  }

  if (init) {
    await initProject(configPath, force)
    return
  }

  try {
    await fs.access(configPath)
  }
  catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error(`Config file not found: ${configPath}\n先执行 industrial-splash --init 初始化配置。`)
    }
    throw error
  }

  const config = await loadConfig(configPath)
  const targets = getTargets(config)
  const selectedTarget = await resolveSelectedTarget(targets, targetId)
  const backgroundColor = parseHexColor(config.backgroundColor)
  const baseDirectory = path.dirname(configPath)
  const logoPath = logoOverridePath ?? path.resolve(baseDirectory, config.logoPath)
  const logoMetadata = await getLogoMetadata(logoPath)
  const renderOptions = getRenderOptions(config, selectedTarget)
  const outputRoot = outputDirOverride ?? path.resolve(baseDirectory, config.outputDir ?? 'output')
  const androidQualifier = String(config.androidQualifier ?? 'land')
  const outputPaths = getOutputPaths(outputRoot, selectedTarget, androidQualifier)
  const splashBuffer = await renderSplashImage({
    logoPath,
    logoMetadata,
    backgroundColor,
    renderOptions,
  })

  const writtenFiles = []

  await writeBuffer(outputPaths.previewPath, splashBuffer)
  await writeBuffer(outputPaths.localAndroidFallbackPath, splashBuffer)
  await writeBuffer(outputPaths.localAndroidQualifiedPath, splashBuffer)

  writtenFiles.push(
    outputPaths.previewPath,
    outputPaths.localAndroidFallbackPath,
    outputPaths.localAndroidQualifiedPath,
  )

  if (androidResDir) {
    await exportToAndroidResDir({
      androidResDir,
      qualifiedDrawableDir: outputPaths.qualifiedDrawableDir,
      buffer: splashBuffer,
      writtenFiles,
    })
  }

  console.log(`当前目标分辨率：${selectedTarget.label}`)
  console.log('Splash generation completed:')
  for (const file of writtenFiles) {
    console.log(` - ${file}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
