#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageJson = JSON.parse(
  await fs.readFile(path.join(__dirname, 'package.json'), 'utf8'),
)
const supportedTemplates = new Set(['workspace', 'default'])

function printHelp() {
  console.log(`
create-industrial-splash v${packageJson.version}

用法：
  create-industrial-splash [workspace-name] [options]

选项：
  -t, --template <name>   模板名称，当前支持 workspace
  --force                 覆盖已存在文件
  -h, --help              显示帮助
  -v, --version           显示版本

示例：
  create-industrial-splash my-splash
  create-industrial-splash my-splash -t workspace
`.trim())
}

function parseArgs(argv) {
  let workspaceName = null
  let template = 'workspace'
  let force = false
  let help = false
  let version = false

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if ((current === '--template' || current === '-t') && argv[index + 1]) {
      template = argv[index + 1]
      index += 1
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
      continue
    }

    if (!current.startsWith('-') && !workspaceName) {
      workspaceName = current
    }
  }

  return {
    workspaceName: workspaceName ?? 'industrial-splash-workspace',
    template,
    force,
    help,
    version,
  }
}

function sanitizePackageName(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'industrial-splash-workspace'
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

async function loadTemplate(templateName) {
  if (!supportedTemplates.has(templateName)) {
    throw new Error(`Unsupported template "${templateName}". Available templates: workspace`)
  }

  const configTemplatePath = path.join(__dirname, 'templates', 'industrial-splash.config.json')
  const brandingReadmePath = path.join(__dirname, 'templates', 'branding.README.txt')
  const workspaceReadmePath = path.join(__dirname, 'templates', 'workspace.README.md')
  const workspaceGitignorePath = path.join(__dirname, 'templates', 'workspace.gitignore')

  return {
    config: await fs.readFile(configTemplatePath, 'utf8'),
    brandingReadme: await fs.readFile(brandingReadmePath, 'utf8'),
    workspaceReadme: await fs.readFile(workspaceReadmePath, 'utf8'),
    workspaceGitignore: await fs.readFile(workspaceGitignorePath, 'utf8'),
  }
}

function buildWorkspacePackageJson(workspaceName) {
  return JSON.stringify({
    name: sanitizePackageName(workspaceName),
    private: true,
    version: '0.0.0',
    description: 'Standalone workspace for industrial-splash-cli',
    scripts: {
      'splash:init': 'npx --yes --package industrial-splash-cli industrial-splash --init',
      'splash': 'npx --yes --package industrial-splash-cli industrial-splash',
      'splash:1280': 'npx --yes --package industrial-splash-cli industrial-splash --target 1280x800',
      'splash:1920': 'npx --yes --package industrial-splash-cli industrial-splash --target 1920x1080',
    },
  }, null, 2) + '\n'
}

function replaceWorkspacePlaceholders(source, workspaceName) {
  return source.replaceAll('{{workspaceName}}', workspaceName)
}

async function createWorkspace({ workspaceName, template, force }) {
  const templateFiles = await loadTemplate(template)
  const workspaceDir = path.resolve(process.cwd(), workspaceName)
  const configPath = path.join(workspaceDir, 'industrial-splash.config.json')
  const brandingReadmePath = path.join(workspaceDir, 'branding', 'README.txt')
  const packageJsonPath = path.join(workspaceDir, 'package.json')
  const readmePath = path.join(workspaceDir, 'README.md')
  const gitignorePath = path.join(workspaceDir, '.gitignore')

  await writeFileIfAllowed(configPath, templateFiles.config, force)
  await writeFileIfAllowed(brandingReadmePath, templateFiles.brandingReadme, force)
  await writeFileIfAllowed(packageJsonPath, buildWorkspacePackageJson(workspaceName), force)
  await writeFileIfAllowed(
    readmePath,
    replaceWorkspacePlaceholders(templateFiles.workspaceReadme, workspaceName),
    force,
  )
  await writeFileIfAllowed(gitignorePath, templateFiles.workspaceGitignore, force)

  console.log('工作区创建完成：')
  console.log(` - ${workspaceDir}`)
  console.log('')
  console.log('下一步：')
  console.log(`  1. 把 logo 放到 ${path.join(workspaceDir, 'branding', 'logo.png')}`)
  console.log(`  2. 进入目录：cd ${workspaceName}`)
  console.log('  3. 执行：npm run splash 或 npm run splash:1280')
}

async function main() {
  const { workspaceName, template, force, help, version } = parseArgs(process.argv.slice(2))

  if (help) {
    printHelp()
    return
  }

  if (version) {
    console.log(packageJson.version)
    return
  }

  await createWorkspace({ workspaceName, template, force })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
