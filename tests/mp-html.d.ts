declare module '@/uni_modules/mp-html/components/mp-html/markdown/marked.min.js' {
  export function marked(source: string): string;
}

declare module '@/uni_modules/mp-html/components/mp-html/parser.js' {
  export interface MpHtmlNode {
    name?: string;
    type?: string;
    text?: string;
    l?: string;
    attrs?: Record<string, string>;
    children?: MpHtmlNode[];
  }
  export default class Parser {
    constructor(vm: Record<string, unknown>);
    parse(content: string): MpHtmlNode[];
  }
}

declare module '@/uni_modules/mp-html/components/mp-html/markdown/index.js' {
  export default class Markdown {
    constructor(vm: Record<string, unknown>);
  }
}

declare module '@/uni_modules/mp-html/components/mp-html/latex/index.js' {
  export default class Latex {
    constructor(vm?: Record<string, unknown>);
  }
}
