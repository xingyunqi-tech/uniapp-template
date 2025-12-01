# Claude Code Hooks

> **自动化规则** | **确定性执行** | **无需手动触发**

## 📖 简介

Hooks 是 Claude Code 的自动化执行机制,在特定事件触发时自动运行命令或提示,不依赖 AI 判断,确保关键规则每次都执行。

## 🆚 Hooks vs Commands vs Skills

| 维度 | Hooks | Commands | Skills |
|------|-------|----------|--------|
| **触发方式** | 自动触发（事件驱动） | 手动调用 `/command` | 自动发现 or 手动调用 |
| **执行方式** | 确定性执行（不依赖 AI） | AI 处理提示 | AI 处理复杂流程 |
| **适用场景** | 强制性规则（格式化、检查） | 快速提醒、模板 | 复杂工作流 |
| **配置位置** | `.claude/settings.json` | `.claude/commands/*.md` | `.claude/skills/**/*.md` |

---

## 🎯 当前配置的 Hooks（3 个）

### 1. UserPromptSubmit - 提交前显示 Git 状态

**触发时机:** 用户提交提示（按 Enter）时

**作用:** 自动显示 Git 状态,提醒用户当前文件变更

**命令:**
```bash
git status --short || true
```

**为什么使用 `|| true`？**
- 确保命令失败时不阻塞 Claude Code
- 即使不在 Git 仓库中也能正常运行

**输出示例:**
```bash
M  src/components/UserCard/index.vue
A  src/views/Dashboard/index.vue
?? src/api/custom/user.ts
```

**好处:**
- ✅ 实时了解文件变更
- ✅ 避免遗漏重要修改
- ✅ 提交前快速检查

---

### 2. SessionStart - 会话开始提醒

**触发时机:** Claude Code 会话开始时

**作用:** 显示欢迎信息和重要规范提醒

**命令:**
```bash
printf '🚀 Vue Admin Template\n📊 分支: %s\n📝 未提交: %s 个文件\n\n⚡ 快速命令: /review-pr | /quick-fix | /git-workflow | /tools\n⚠️  规范提醒: API从@/api导入 | 颜色用CSS变量 | Props/Emits分离\n' "$(git branch --show-current 2>/dev/null || echo 'unknown')" "$(git status --short 2>/dev/null | wc -l | tr -d ' ')"
```

**为什么使用 `printf` 而不是 `echo`？**
- `printf` 跨平台兼容性更好（POSIX 标准）
- 支持格式化占位符 `%s`，动态插入分支名和文件数
- 转义字符处理一致（`\n` 换行）
- `echo` 在不同 shell 中行为不一致（bash 需要 `-e`，zsh 直接支持）

**好处:**
- ✅ 提醒重要开发规范
- ✅ 快速了解可用命令
- ✅ 提升开发效率

---

### 3. SessionEnd - 会话结束提醒

**触发时机:** Claude Code 会话结束时

**作用:** 显示 Git 状态，提醒用户保存或提交代码

**命令:**
```bash
printf '👋 会话结束！\n\n📊 Git 状态：\n' && git status --short 2>/dev/null || echo '无 Git 仓库'
```

**输出示例:**
```bash
👋 会话结束！

📊 Git 状态：
M  src/components/UserCard/index.vue
A  src/views/Dashboard/index.vue
?? src/api/custom/user.ts
```

**好处:**
- ✅ 会话结束时提醒 Git 状态
- ✅ 避免遗漏未提交的修改
- ✅ 养成良好的提交习惯

---

## 📚 可用的 Hook 事件

根据 Claude Code 文档,支持以下 Hook 事件:

| Hook 事件 | 触发时机 | 适用场景 |
|----------|---------|---------|
| **PreToolUse** | 工具调用前 | 文件写入前检查、阻止危险操作 |
| **PostToolUse** | 工具调用后 | 文件写入后自动格式化、通知 |
| **UserPromptSubmit** | 用户提交提示时 | 显示状态、提醒检查 |
| **Notification** | 发送通知时 | 自定义通知行为 |
| **SessionStart** | 会话开始时 | 初始化环境、显示欢迎信息 |
| **SessionEnd** | 会话结束时 | 清理环境、保存状态 |
| **Stop** | 停止执行时 | 中断处理、清理资源 |
| **SubagentStop** | 子 Agent 停止时 | 子任务完成处理 |
| **PreCompact** | 压缩上下文前 | 保存重要信息 |

---

## 🚀 推荐的 Hooks 配置

### 配置 1: PreToolUse - 写文件前检查

**用途:** 写文件前显示提醒信息

**配置:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "printf '⚠️  写文件前检查: %s\n' \"$FILE_PATH\" || true"
          }
        ]
      }
    ]
  }
}
```

**说明:**
- 只在 `Write` 工具调用时触发
- `|| true` 确保命令失败不阻塞流程
- `$FILE_PATH` 是写入的文件路径
- 使用 `printf` 格式化输出

---

### 配置 2: PostToolUse - 写文件后显示确认

**用途:** 写文件后显示文件路径确认

**配置:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "printf '✅ 文件已写入: %s\n' \"$FILE_PATH\"",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**说明:**
- 写文件后显示确认信息
- `timeout: 5` 设置超时时间（秒）
- 帮助用户了解文件写入操作

---

### 配置 3: SessionStart - 会话开始提示

**用途:** 会话开始时显示欢迎信息和项目规范提醒

**配置:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "printf '🚀 Vue Admin Template\\n📊 分支: %s\\n📝 未提交: %s 个文件\\n\\n⚡ 快速命令: /review-pr | /quick-fix | /git-workflow | /tools\\n⚠️  规范提醒: API从@/api导入 | 颜色用CSS变量 | Props/Emits分离\\n' \"$(git branch --show-current 2>/dev/null || echo 'unknown')\" \"$(git status --short 2>/dev/null | wc -l | tr -d ' ')\""
          }
        ]
      }
    ]
  }
}
```

**说明:**
- 使用 `printf` 格式化输出
- `%s` 占位符动态插入分支名和文件数
- `2>/dev/null` 抑制错误输出
- `|| echo 'unknown'` 提供默认值

---

### 配置 4: SessionEnd - 会话结束清理

**用途:** 会话结束时显示 Git 状态提醒

**配置:**
```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "printf '👋 会话结束！\\n\\n📊 Git 状态：\\n' && git status --short 2>/dev/null || echo '无 Git 仓库'"
          }
        ]
      }
    ]
  }
}
```

**说明:**
- 使用 `printf` 替代 `echo`
- `2>/dev/null || echo '无 Git 仓库'` 处理非 Git 仓库情况

---

## ⚠️ 重要安全提醒

### 安全原则

**根据 Claude Code 官方文档:**

> "You must consider the security implication of hooks as you add them, because hooks run automatically during the agent loop with your current environment's credentials."

### 安全建议

1. **只运行只读检查**
   ```bash
   # ✅ 安全：只读命令
   git status --short || true
   pnpm type-check || true
   cat file.txt || true

   # ❌ 危险：修改文件
   rm -rf dist/
   git reset --hard
   pnpm install  # 可能修改 node_modules
   ```

2. **使用 `|| true` 避免阻塞**
   ```bash
   # ✅ 推荐：失败不阻塞
   pnpm lint || true
   git status --short || true

   # ❌ 不推荐：失败会阻塞 Claude
   pnpm lint
   git status --short
   ```

3. **设置超时时间**
   ```json
   {
     "type": "command",
     "command": "pnpm build",
     "timeout": 60
   }
   ```

4. **使用 `printf` 而不是 `echo`**
   ```bash
   # ✅ 推荐：printf 跨平台兼容
   printf 'Line 1\nLine 2\n'
   printf 'Branch: %s\n' "$(git branch --show-current)"

   # ⚠️  可用但不推荐：echo 行为不一致
   echo -e "Line 1\nLine 2"  # bash 需要 -e
   echo "Line 1\nLine 2"     # zsh 直接支持
   ```

5. **避免敏感操作**
   - ❌ 不要运行 `git push`（自动推送代码）
   - ❌ 不要运行 `pnpm publish`（自动发布包）
   - ❌ 不要运行 `docker rm`（删除容器）
   - ❌ 不要访问敏感文件（密钥、密码）

6. **谨慎使用 matcher**
   ```json
   // ❌ 危险：匹配所有工具
   {
     "hooks": {
       "PreToolUse": [
         {
           "hooks": [
             {
               "type": "command",
               "command": "expensive-check"
             }
           ]
         }
       ]
     }
   }

   // ✅ 推荐：只匹配特定工具
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Write",
           "hooks": [
             {
               "type": "command",
               "command": "printf '⚠️  检查文件: %s\\n' \"$FILE_PATH\" || true"
             }
           ]
         }
       ]
     }
   }
   ```

---

## 🛠️ Hooks vs Husky

### 区别

| 维度 | Claude Code Hooks | Husky Hooks |
|------|------------------|-------------|
| **触发时机** | Claude Code 工具调用时 | Git 操作时 |
| **适用场景** | Claude 写代码时自动检查 | Git commit/push 时检查 |
| **配置位置** | `.claude/settings.json` | `.husky/` |
| **执行环境** | Claude Code 进程 | Git 钩子 |

### 推荐使用场景

**使用 Claude Code Hooks:**
- ✅ Claude 写文件前/后的自动提醒
- ✅ Claude 会话开始/结束的状态显示
- ✅ 实时反馈（立即显示 Git 状态）

**使用 Husky Hooks:**
- ✅ Git commit 前的代码检查（pnpm lint）
- ✅ Git commit 前的类型检查（pnpm type-check）
- ✅ 提交信息规范检查（commitlint）

**最佳实践:** 两者结合使用
- Claude Hooks: 轻量级提醒（只读操作）
- Husky Hooks: 代码质量检查（可能阻塞提交）

---

## 🎯 推荐的完整配置

### 轻量级配置（当前配置）

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git status --short || true"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "printf '🚀 Vue Admin Template\\n📊 分支: %s\\n📝 未提交: %s 个文件\\n\\n⚡ 快速命令: /review-pr | /quick-fix | /git-workflow | /tools\\n⚠️  规范提醒: API从@/api导入 | 颜色用CSS变量 | Props/Emits分离\\n' \"$(git branch --show-current 2>/dev/null || echo 'unknown')\" \"$(git status --short 2>/dev/null | wc -l | tr -d ' ')\""
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "printf '👋 会话结束！\\n\\n📊 Git 状态：\\n' && git status --short 2>/dev/null || echo '无 Git 仓库'"
          }
        ]
      }
    ]
  }
}
```

**优点:**
- ✅ 轻量级，不影响性能
- ✅ 实用，显示 Git 状态和重要规范
- ✅ 安全，只读命令，使用 `|| true` 避免阻塞
- ✅ 跨平台兼容，使用 `printf` 而不是 `echo`
- ✅ 覆盖完整会话周期（开始 → 执行 → 结束）

---

### 进阶配置（可选）

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "printf '⚠️  写文件前检查: %s\\n' \"$FILE_PATH\" || true",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "printf '✅ 文件已写入: %s\\n' \"$FILE_PATH\"",
            "timeout": 5
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git status --short || true"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "printf '🚀 Vue Admin Template\\n📊 分支: %s\\n📝 未提交: %s 个文件\\n\\n⚡ 快速命令: /review-pr | /quick-fix | /git-workflow | /tools\\n⚠️  规范提醒: API从@/api导入 | 颜色用CSS变量 | Props/Emits分离\\n' \"$(git branch --show-current 2>/dev/null || echo 'unknown')\" \"$(git status --short 2>/dev/null | wc -l | tr -d ' ')\""
          }
        ]
      }
    ]
  }
}
```

**注意:**
- 进阶配置会增加执行耗时
- 建议根据实际需求逐步添加
- 始终使用 `|| true` 避免阻塞

---

## 🐛 调试 Hooks

### 检查 Hooks 是否生效

```bash
# 1. 检查配置文件语法
cat .claude/settings.json | jq

# 2. 查看 Claude Code 日志
# Claude Code 会在控制台输出 Hook 执行日志

# 3. 测试单个命令
git status --short || true
printf 'Branch: %s\n' "$(git branch --show-current 2>/dev/null || echo 'unknown')"
printf 'Files: %s\n' "$(git status --short 2>/dev/null | wc -l | tr -d ' ')"
```

### 常见问题

**问题 1: Hook 未执行**

**原因:** 配置格式错误或事件名拼写错误

**解决:**
```bash
# 检查 settings.json 格式
cat .claude/settings.json | jq

# 确保事件名正确（区分大小写）
# ✅ 正确
"UserPromptSubmit"

# ❌ 错误
"user-prompt-submit"
"userPromptSubmit"
```

---

**问题 2: Hook 执行失败**

**原因:** 命令不存在或路径错误

**解决:**
```bash
# 检查命令是否存在
which git
which pnpm
which printf

# 使用绝对路径（如果需要）
{
  "type": "command",
  "command": "/usr/bin/git status --short || true"
}

# printf 是内建命令,不需要绝对路径
```

---

**问题 3: Hook 阻塞 Claude**

**原因:** 命令耗时过长或未使用 `|| true`

**解决:**
```bash
# 1. 添加超时时间
{
  "type": "command",
  "command": "pnpm lint",
  "timeout": 30
}

# 2. 使用 || true 避免失败阻塞
{
  "type": "command",
  "command": "pnpm lint || true"
}

# 3. 使用 2>/dev/null 抑制错误输出
{
  "type": "command",
  "command": "git status --short 2>/dev/null || true"
}
```

---

## 📚 相关资源

### 官方文档
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code Settings Schema](https://json.schemastore.org/claude-code-settings.json)

### 项目文档
- `.claude/commands/` - 7 个 Commands
- `.claude/skills/` - 10 个 Skills
- `.claude/agents/` - 10 个 Agents

---

## 🎉 开始使用

当前项目已配置 3 个 Hooks（UserPromptSubmit、SessionStart、SessionEnd），覆盖完整的会话周期。

如需添加更多 Hooks,请参考上面的推荐配置,逐步添加到 `.claude/settings.json` 中。

**记住：Hooks 会自动运行，使用当前环境凭据。请确保只运行安全的命令！**

---

**最后更新:** 2025-11-17

**当前配置:**
- 3 个 Hooks (UserPromptSubmit, SessionStart, SessionEnd)
- 轻量级设计，只读操作
- 使用 `printf` 确保跨平台兼容
- 使用 `|| true` 避免阻塞
