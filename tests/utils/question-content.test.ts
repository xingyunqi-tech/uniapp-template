import { beforeAll, describe, expect, it } from 'vitest';
import { QuestionType, type PublicQuestionUnitDto } from '@/api';
import { marked } from '@/uni_modules/mp-html/components/mp-html/markdown/marked.min.js';
import type { MpHtmlNode } from '@/uni_modules/mp-html/components/mp-html/parser.js';
import {
  answerableQuestions,
  displayOptions,
  escapeContent,
  JUDGE_OPTIONS,
  preserveLineBreaks,
  resolveFileReferences,
  sanitizeLinks,
  toQuestionOptions,
  toQuestionView,
  toRichContent,
} from '@/utils/question-content';

const FILE_ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

function decodeEntities(html: string): string {
  return html.replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function unit(overrides: Partial<PublicQuestionUnitDto> = {}): PublicQuestionUnitDto {
  return {
    id: 'q1',
    subjectId: 's1',
    parentId: null,
    type: QuestionType.SINGLE,
    version: 1,
    stem: '题干',
    options: [
      { key: 'A', content: '甲' },
      { key: 'B', content: '乙' },
    ],
    material: null,
    audioFileId: null,
    audioUrl: null,
    blankCount: null,
    difficulty: 1,
    knowledgePointIds: [],
    isFree: true,
    sort: 0,
    ...overrides,
  };
}

describe('resolveFileReferences', () => {
  it('把 file:{id} 替换为访问地址，未知文件保留原文', () => {
    const other = '11111111-2222-3333-4444-555555555555';
    const text = `![图](file:${FILE_ID.toUpperCase()}) ![缺](file:${other})`;

    expect(resolveFileReferences(text, { [FILE_ID]: 'https://cdn/a.png' })).toBe(
      `![图](https://cdn/a.png) ![缺](file:${other})`,
    );
  });

  it('未传地址表时原样返回', () => {
    expect(resolveFileReferences(`file:${FILE_ID}`)).toBe(`file:${FILE_ID}`);
  });
});

describe('escapeContent', () => {
  it('公式内的 Markdown 标点转为实体，分隔符保留', () => {
    expect(escapeContent('设 $a_1*b$ 为')).toBe('设 $a&#95;1&#42;b$ 为');
  });

  it('块级公式可跨行，换行转为空格', () => {
    expect(escapeContent('$$x\n+y$$')).toBe('$$x &#43;y$$');
  });

  it('非公式位置的 $ 输出为独立的 span', () => {
    expect(escapeContent('价格 $ 5 与 $3')).toBe('价格 <span>&#36;</span> 5 与 <span>&#36;</span>3');
    expect(escapeContent('\\$5 和 $x_1$')).toBe('<span>&#36;</span>5 和 $x&#95;1$');
  });

  it('原始 HTML 被转义', () => {
    expect(escapeContent('<img src=x onerror=alert(1)>')).toBe('&#60;img src=x onerror=alert(1)>');
  });

  it('行内代码与代码块转为 HTML 并保留原文', () => {
    expect(escapeContent('用 `a*$b` 表示')).toBe('用 <code>a&#42;<span>&#36;</span>b</code> 表示');
    expect(escapeContent('```\n<b>$x$</b>\n```')).toBe(
      '<pre><code>&#60;b&#62;<span>&#36;</span>x<span>&#36;</span>&#60;&#47;b&#62;</code></pre>',
    );
  });
});

describe('sanitizeLinks', () => {
  it('过滤 javascript 等危险协议的链接与图片', () => {
    expect(sanitizeLinks('[点我](javascript:alert(1)) ![](data:text/html,x)')).toBe('[点我](#) ![](#)');
    expect(sanitizeLinks('[x](&#106;&#97;&#118;&#97;script:alert(1))')).toBe('[x](#)');
    expect(sanitizeLinks('[ref]: javascript:alert(1)')).toBe('[ref]: #');
  });

  it('保留 http(s) 与相对地址', () => {
    const text = '[a](https://example.com/a) ![](/static/a.png) [b](mailto:a@b.c)';

    expect(sanitizeLinks(text)).toBe(text);
  });
});

describe('preserveLineBreaks', () => {
  it('段落内单个换行补为硬换行', () => {
    expect(preserveLineBreaks('第一行\n第二行\n\n新段落')).toBe('第一行  \n第二行\n\n新段落');
  });

  it('表格行与代码块不处理', () => {
    const table = '| a | b |\n| --- | --- |\n| 1 | 2 |';
    const code = '```\nx\ny\n```';

    expect(preserveLineBreaks(table)).toBe(table);
    expect(preserveLineBreaks(code)).toBe(code);
  });
});

describe('toRichContent', () => {
  it('原始 HTML 与危险链接经 Markdown 解析后不生成标签与链接', () => {
    const html = marked(toRichContent('<script>alert(1)</script> [x](javascript:alert(1))'));

    expect(html).not.toContain('<script');
    expect(html).not.toContain('javascript:');
  });

  it('经 Markdown 解析后公式原文不变', () => {
    const html = marked(toRichContent('已知 $a_1 * b_2 = \\frac{x}{y}$，求 *x*'));
    const text = decodeEntities(html);

    expect(text).toContain('$a_1 * b_2 = \\frac{x}{y}$');
    expect(text).toContain('<em>x</em>');
  });

  it('表格中的公式保持原文', () => {
    const html = marked(toRichContent('| 年份 | 增速 |\n| --- | --- |\n| 2024 | $10\\%$ |'));

    expect(html).toContain('<table>');
    expect(decodeEntities(html)).toContain('$10\\%$');
  });

  it('空内容返回空字符串', () => {
    expect(toRichContent(null)).toBe('');
    expect(toRichContent('')).toBe('');
  });

  it('统一换行符并替换文件引用', () => {
    expect(toRichContent(`a\r\n![](file:${FILE_ID})`, { [FILE_ID]: 'https://cdn/a.png' })).toBe(
      'a  \n![](https://cdn/a.png)',
    );
  });
});

describe('题目视图', () => {
  it('过滤结构不合法的选项', () => {
    expect(toQuestionOptions([{ key: 'A', content: '甲' }, { key: 1 }, null])).toEqual([{ key: 'A', content: '甲' }]);
    expect(toQuestionOptions(null)).toEqual([]);
  });

  it('判断题没有选项时使用正确/错误', () => {
    expect(displayOptions({ type: QuestionType.JUDGE, options: [] })).toEqual(JUDGE_OPTIONS);
    expect(displayOptions({ type: QuestionType.SINGLE, options: [] })).toEqual([]);
  });

  it('使用接口返回的音频地址与填空空数', () => {
    const view = toQuestionView(unit({ type: QuestionType.FILL, audioUrl: 'https://cdn/b.mp3', blankCount: 2 }));

    expect(view.audioUrl).toBe('https://cdn/b.mp3');
    expect(view.blankCount).toBe(2);
  });

  it('材料题转换小题并按 fileUrls 解析音频地址', () => {
    const view = toQuestionView(
      unit({
        type: QuestionType.MATERIAL,
        options: null,
        material: '材料',
        audioFileId: FILE_ID.toUpperCase(),
        children: [unit({ id: 'c1', parentId: 'q1' }), unit({ id: 'c2', parentId: 'q1' })],
      }),
      { [FILE_ID]: 'https://cdn/a.mp3' },
    );

    expect(view.audioUrl).toBe('https://cdn/a.mp3');
    expect(view.material).toBe('材料');
    expect(answerableQuestions(view).map(item => item.id)).toEqual(['c1', 'c2']);
  });

  it('独立题的可作答题为自身，缺少音频地址时为 null', () => {
    const view = toQuestionView(unit({ audioFileId: FILE_ID }));

    expect(view.audioUrl).toBeNull();
    expect(answerableQuestions(view)).toEqual([view]);
  });
});

describe('mp-html 解析与 latex 插件', () => {
  let render: (content: string) => MpHtmlNode[];

  beforeAll(async () => {
    Object.assign(uni, {
      canIUse: () => true,
      getWindowInfo: () => ({ windowWidth: 375 }),
      getDeviceInfo: () => ({ system: 'iOS 17' }),
    });
    const { default: Parser } = await import('@/uni_modules/mp-html/components/mp-html/parser.js');
    const { default: Markdown } = await import('@/uni_modules/mp-html/components/mp-html/markdown/index.js');
    const { default: Latex } = await import('@/uni_modules/mp-html/components/mp-html/latex/index.js');
    render = content => {
      const vm: Record<string, unknown> = { markdown: true, containerStyle: '', imgList: [], nodes: [] };
      vm.plugins = [new Latex(vm), new Markdown(vm)];
      return new Parser(vm).parse(content);
    };
  });

  function summarize(nodes: MpHtmlNode[]): { formulas: number; text: string } {
    let formulas = 0;
    let text = '';
    const walk = (list: MpHtmlNode[]) => {
      for (const node of list) {
        if (node.l === 'T' || node.attrs?.style === 'text-align:center') {
          formulas += 1;
        } else if (node.type === 'text') {
          text += node.text;
        } else if (node.children) {
          walk(node.children);
        }
      }
    };
    walk(nodes);
    return { formulas, text };
  }

  it('公式渲染为 latex 节点，Markdown 语法照常生效', () => {
    const result = summarize(render(toRichContent('已知 $a_1 * b_2 = \\frac{x}{y}$，求 **x**')));

    expect(result.formulas).toBe(1);
    expect(result.text).toBe('已知 ，求 x');
  });

  it('非公式位置的 $ 不与公式的分隔符配对', () => {
    const result = summarize(render(toRichContent('原价 \\$5，现价 $ 3，公式 $x^2$')));

    expect(result.formulas).toBe(1);
    expect(result.text).toBe('原价 $5，现价 $ 3，公式 ');
  });

  it('块级公式与表格中的公式都被渲染', () => {
    const result = summarize(
      render(toRichContent('$$\\sum_{i=1}^{n} i$$\n\n| 年份 | 增速 |\n| --- | --- |\n| 2024 | $10\\%$ |')),
    );

    expect(result.formulas).toBe(2);
  });

  it('原始 HTML 不生成标签', () => {
    const nodes = render(toRichContent('<img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a>'));
    const names: string[] = [];
    const walk = (list: MpHtmlNode[]) =>
      list.forEach(node => {
        if (node.name) names.push(node.name);
        if (node.children) walk(node.children);
      });
    walk(nodes);

    expect(names).not.toContain('img');
    expect(names).not.toContain('a');
  });
});
