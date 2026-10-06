import { execSync } from 'child_process';
import chalk from 'chalk';

const COMMIT_MESSAGE_FILE = process.argv[2];
if (!COMMIT_MESSAGE_FILE) {
  console.error(chalk.red('❌ 没有提供 commit message 文件路径'));
  process.exit(1);
}
// commitlint校验（规则见 commitlint.config.ts）
try {
  execSync(`pnpm exec commitlint --edit "${COMMIT_MESSAGE_FILE}"`, { stdio: 'inherit' });
  console.log(chalk.green('✅ Commitlint 检查通过'));
} catch {
  console.error(`${chalk.bgRed.white(' 错误 ')} ${chalk.yellow('提交信息格式不正确！')}`);
  console.error(
    `${chalk.blue('正确格式:')} ${chalk.green('type: subject')} ${chalk.yellow('或')} ${chalk.green('type(scope): subject')}`,
  );
  console.error(
    `${chalk.blue('示例:')} ${chalk.green('feat: 添加用户登录功能')} ${chalk.yellow('或')} ${chalk.green('fix(auth): 修复登录验证问题')}`,
  );
  console.error(chalk.red('❌ Commitlint 校验失败，具体原因见上方输出'));
  process.exit(1);
}
