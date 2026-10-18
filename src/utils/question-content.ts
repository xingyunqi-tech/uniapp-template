import { QuestionType, type PublicQuestionDto, type PublicQuestionUnitDto } from '@/api';

export interface QuestionOption {
  key: string;
  content: string;
}

export interface QuestionView {
  id: string;
  type: QuestionType;
  stem: string;
  options: QuestionOption[];
  material: string | null;
  audioUrl: string | null;
  blankCount: number | null;
  children: QuestionView[];
}

export const JUDGE_OPTIONS: readonly QuestionOption[] = [
  { key: 'true', content: '正确' },
  { key: 'false', content: '错误' },
];

const FILE_REFERENCE = /file:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
const ASCII_PUNCTUATION = /[!-#%-/:-@[-`{-~]/;
const LITERAL_DOLLAR = '<span>&#36;</span>';
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const SAFE_URL = /^(https?:\/\/|mailto:|tel:)/i;

export function resolveFileReferences(text: string, fileUrls?: Record<string, string>): string {
  if (!fileUrls) return text;
  return text.replace(FILE_REFERENCE, (match, id: string) => fileUrls[id.toLowerCase()] ?? match);
}

function isSafeUrl(url: string): boolean {
  const decoded = url
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, code: string) => String.fromCharCode(Number(code)))
    .split('')
    .filter(char => char.charCodeAt(0) > 32)
    .join('');
  if (SAFE_URL.test(decoded)) return true;
  return !decoded.includes(':') && !url.includes('&');
}

/** 链接与图片地址只允许 http(s)、mailto、tel 与相对地址，其余替换为 # */
export function sanitizeLinks(text: string): string {
  const replace = (url: string) => (isSafeUrl(url) ? url : '#');
  return text
    .replace(/(\]\(\s*<?)((?:[^()\s<>]|\([^()\s]*\))*)/g, (_, prefix: string, url: string) => prefix + replace(url))
    .replace(
      /^( {0,3}\[[^\]]+\]:\s*<?)(\S*?)(?=>?(\s|$))/gm,
      (_, prefix: string, url: string) => prefix + replace(url),
    );
}

function findClosing(text: string, from: number, delimiter: string): number {
  let index = text.indexOf(delimiter, from);
  while (index > 0 && text[index - 1] === '\\') index = text.indexOf(delimiter, index + 1);
  return index;
}

/** 公式内的 ASCII 标点转为 HTML 实体 */
function encodeFormula(body: string): string {
  let encoded = '';
  for (const char of body) {
    if (/\s/.test(char)) encoded += ' ';
    else if (ASCII_PUNCTUATION.test(char)) encoded += `&#${char.charCodeAt(0)};`;
    else encoded += char;
  }
  return encoded;
}

function encodeLiteral(text: string): string {
  let encoded = '';
  for (const char of text) {
    if (char === '$') encoded += LITERAL_DOLLAR;
    else if (ASCII_PUNCTUATION.test(char)) encoded += `&#${char.charCodeAt(0)};`;
    else encoded += char;
  }
  return encoded;
}

function escapeInline(line: string): string {
  let result = '';
  let index = 0;
  while (index < line.length) {
    const char = line[index];
    if (char === '\\' && line[index + 1] === '$') {
      result += LITERAL_DOLLAR;
      index += 2;
    } else if (char === '\\' && index + 1 < line.length) {
      result += line[index + 1] === '<' ? '&#60;' : char + line[index + 1];
      index += 2;
    } else if (char === '`') {
      const fence = /^`+/.exec(line.slice(index))![0];
      const close = line.indexOf(fence, index + fence.length);
      if (close < 0 || line[close + fence.length] === '`') {
        result += fence;
        index += fence.length;
      } else {
        result += `<code>${encodeLiteral(line.slice(index + fence.length, close))}</code>`;
        index = close + fence.length;
      }
    } else if (char === '$') {
      const delimiter = line[index + 1] === '$' ? '$$' : '$';
      const start = index + delimiter.length;
      const end = findClosing(line, start, delimiter);
      const body = end > start ? line.slice(start, end) : '';
      const invalid =
        !body.trim() || body.includes('$') || (delimiter === '$' && (/^\s|\s$/.test(body) || body.includes('\n')));
      if (invalid) {
        result += LITERAL_DOLLAR;
        index += 1;
      } else {
        result += delimiter + encodeFormula(body) + delimiter;
        index = end + delimiter.length;
      }
    } else {
      result += char === '<' ? '&#60;' : char;
      index += 1;
    }
  }
  return result;
}

/** 转义原始 HTML 并保护公式，公式以外的 $ 不参与 latex 插件配对 */
export function escapeContent(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length > 0) output.push(escapeInline(paragraph.join('\n')));
    paragraph = [];
  };
  for (let index = 0; index < lines.length; index += 1) {
    const fence = FENCE.exec(lines[index]);
    if (!fence) {
      if (lines[index].trim()) paragraph.push(lines[index]);
      else {
        flush();
        output.push(lines[index]);
      }
      continue;
    }
    flush();
    const marker = fence[1];
    let close = index + 1;
    while (close < lines.length && !lines[close].trim().startsWith(marker)) close += 1;
    output.push(`<pre><code>${encodeLiteral(lines.slice(index + 1, close).join('\n'))}</code></pre>`);
    index = close;
  }
  flush();
  return output.join('\n');
}

/** 段落内的单个换行保留为换行 */
export function preserveLineBreaks(text: string): string {
  const lines = text.split('\n');
  let inFence = false;
  return lines
    .map((line, index) => {
      if (FENCE.test(line)) {
        inFence = !inFence;
        return line;
      }
      const next = lines[index + 1];
      const isTableRow = (value: string) => value.trim().startsWith('|');
      if (inFence || !line.trim() || next === undefined || !next.trim() || isTableRow(line) || isTableRow(next)) {
        return line;
      }
      return /( {2}|\\)$/.test(line) ? line : `${line}  `;
    })
    .join('\n');
}

export function toRichContent(text: string | null | undefined, fileUrls?: Record<string, string>): string {
  if (!text) return '';
  const normalized = resolveFileReferences(text.replace(/\r\n?/g, '\n'), fileUrls);
  return escapeContent(preserveLineBreaks(sanitizeLinks(normalized)));
}

export function toQuestionOptions(raw: unknown): QuestionOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => {
    const { key, content } = (item ?? {}) as Record<string, unknown>;
    return typeof key === 'string' && typeof content === 'string' ? [{ key, content }] : [];
  });
}

export function displayOptions(question: Pick<QuestionView, 'type' | 'options'>): QuestionOption[] {
  if (question.type === QuestionType.JUDGE && question.options.length === 0) return [...JUDGE_OPTIONS];
  return question.options;
}

export function isAnswerable(type: QuestionType): boolean {
  return type !== QuestionType.MATERIAL;
}

export function toQuestionView(
  question: PublicQuestionUnitDto | PublicQuestionDto,
  fileUrls?: Record<string, string>,
): QuestionView {
  const audioUrl =
    question.audioUrl ?? (question.audioFileId ? (fileUrls?.[question.audioFileId.toLowerCase()] ?? null) : null);
  const children = 'children' in question && question.children ? question.children : [];
  return {
    id: question.id,
    type: question.type,
    stem: question.stem,
    options: toQuestionOptions(question.options),
    material: question.material,
    audioUrl,
    blankCount: question.blankCount,
    children: children.map(child => toQuestionView(child, fileUrls)),
  };
}

/** 材料题返回小题，独立题返回自身 */
export function answerableQuestions(question: QuestionView): QuestionView[] {
  return question.type === QuestionType.MATERIAL ? question.children : [question];
}
