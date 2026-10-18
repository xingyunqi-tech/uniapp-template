import fs from 'node:fs';
import chalk from 'chalk';

/** 检查范围：业务样式（SFC 的 <style> 块与 scss） */
const SOURCE_PATTERN = 'src/**/*.{scss,vue}';

/** 变量定义源与第三方/生成产物，不检查硬编码颜色 */
const COLOR_IGNORE = ['src/styles/theme.scss', 'src/static/**', 'src/api/generated/**', 'src/uni_modules/**'];

/** uni-app 运行时注入的 CSS 变量 */
const UNI_BUILTIN_VARS = new Set([
  'status-bar-height',
  'window-top',
  'window-bottom',
  'window-left',
  'window-right',
  'top-window-height',
  'left-window-width',
  'right-window-width',
]);

// hex 只认 3/4/6/8 位，且后面不能再跟标识符字符——否则 `#default` 这类插槽简写会被截成 `#defa`
const colorPattern =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])|\b(?:rgb|rgba|hsl|hsla)\([^)]+\)/g;
const varUsagePattern = /var\(\s*--([a-zA-Z0-9_-]+)/g;
// `//` 紧跟在 `:`、引号、`(`、`=` 之后时是 URL（如 `https://`、`url(//cdn...)`），不算注释
const commentStartPattern = /(?<![:'"(=])\/\/|\/\*|<!--/;
// 定义包括样式声明 `--x:`、对象字面量 `'--x':` 与下标赋值 `style['--x'] =`
const varDefinitionPattern = /(?:^|[\s{;'"`[])--([a-zA-Z0-9_-]+)\s*['"`]?\s*(?::|\]\s*=(?![=>]))/gm;

interface Issue {
  file: string;
  line: number;
  column: number;
  message: string;
}

function checkCssVars() {
  const files = fs.globSync(SOURCE_PATTERN);
  const definitionFiles = fs.globSync('src/**/*.{scss,vue,ts,css}');

  const definedVars = new Set<string>();
  for (const file of definitionFiles) {
    for (const match of fs.readFileSync(file, 'utf-8').matchAll(varDefinitionPattern)) definedVars.add(match[1]);
  }

  const colorIgnored = new Set(COLOR_IGNORE.flatMap(pattern => fs.globSync(pattern)));
  const issues: Issue[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');

    if (!colorIgnored.has(file)) {
      for (const match of content.matchAll(colorPattern)) {
        const position = locate(content, match.index ?? 0);
        if (isInComment(position.lineText, position.column)) continue;
        issues.push({ file, ...position, message: `硬编码颜色值: ${chalk.yellow(match[0])}` });
      }
    }

    for (const match of content.matchAll(varUsagePattern)) {
      const name = match[1];
      if (definedVars.has(name) || UNI_BUILTIN_VARS.has(name)) continue;
      const position = locate(content, match.index ?? 0);
      if (isInComment(position.lineText, position.column)) continue;
      issues.push({ file, ...position, message: `未定义的 CSS 变量: ${chalk.yellow(`--${name}`)}` });
    }
  }

  if (issues.length > 0) {
    console.log(chalk.bold('\n🔍 样式检查结果:\n'));
    issues.forEach(({ file, line, column, message }) => {
      console.log(`${chalk.cyan(`${file}:${line}:${column}`)}\n  ${chalk.red('✖')} ${message}\n`);
    });
    console.log(chalk.red(`✖ 发现 ${issues.length} 个问题，请使用 src/styles/theme.scss 中定义的 CSS 变量\n`));
    process.exit(1);
  }

  console.log(chalk.green('\n✓ 没有发现硬编码颜色或未定义的 CSS 变量\n'));
}

/** 整行注释，或注释起始符排在目标之前 */
function isInComment(lineText: string, column: number): boolean {
  const trimmedLine = lineText.trim();
  if (['//', '/*', '*', '<!--'].some(mark => trimmedLine.startsWith(mark))) return true;

  const commentStart = lineText.search(commentStartPattern);
  return commentStart !== -1 && column > commentStart + 1;
}

/** 按字符下标定位行号、列号（均为 1-based）并取出所在行原文 */
function locate(content: string, index: number): { line: number; column: number; lineText: string } {
  const before = content.slice(0, index);
  const lineStart = before.lastIndexOf('\n') + 1;
  const lineEnd = content.indexOf('\n', index);

  return {
    line: before.split('\n').length,
    column: index - lineStart + 1,
    lineText: content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd),
  };
}

checkCssVars();
