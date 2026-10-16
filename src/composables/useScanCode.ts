import { ref, type Ref } from 'vue';
import { parseQuery } from '@/utils/router';
import { isUserCancel } from '@/utils/platform';

export interface ScanCodeResult {
  /** 扫描结果内容 */
  result: string;
  /** 扫描类型 (QR_CODE, BAR_CODE 等) */
  scanType: string;
  /** 字符集 */
  charSet?: string;
  /** 原始数据 */
  rawData?: string;
  /** 解析后的 URL 参数 (parseUrlParams 为 true 时) */
  params?: Record<string, string>;
}

export interface UseScanCodeOptions {
  /** 只扫描二维码，默认 false */
  onlyFromCamera?: boolean;
  /** 扫描类型: barCode | qrCode | datamatrix | pdf417，默认全部 */
  scanType?: ('barCode' | 'qrCode' | 'datamatrix' | 'pdf417')[];
  /** 是否自动识别字符编码，默认 false */
  autoDecodeCharSet?: boolean;
  /** 自动解析 URL 中的参数，默认 false */
  parseUrlParams?: boolean;
}

export interface UseScanCodeReturn {
  /** 扫码结果 */
  result: Ref<ScanCodeResult | null>;
  /** 是否正在扫描 */
  isScanning: Ref<boolean>;
  /** 扫描错误 */
  error: Ref<Error | null>;
  /** 开始扫码 */
  scan: () => Promise<ScanCodeResult | null>;
  /** 解析二维码内容中的 URL 参数 */
  parseResult: (text: string) => Record<string, string>;
}

/**
 * 扫码 Composable
 * @description 统一扫码操作，支持二维码/条形码
 * @example
 * ```ts
 * const { scan, result, isScanning } = useScanCode();
 *
 * // 开始扫码
 * async function handleScan() {
 *   const scanResult = await scan();
 *   if (scanResult) {
 *     console.log('扫码结果:', scanResult.result);
 *   }
 * }
 * ```
 */
export function useScanCode(options: UseScanCodeOptions = {}): UseScanCodeReturn {
  const { onlyFromCamera = false, scanType, autoDecodeCharSet = false, parseUrlParams = false } = options;

  const result = ref<ScanCodeResult | null>(null);
  const isScanning = ref(false);
  const error = ref<Error | null>(null);

  /**
   * 解析 URL 参数
   * 复用 utils/router 的 parseQuery 函数
   */
  function parseResult(text: string): Record<string, string> {
    // 复用 router.ts 的 parseQuery 函数
    const params = parseQuery(text);

    // parseQuery 返回的值可能包含 undefined，转换为 string
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        result[key] = String(value);
      }
    }

    return result;
  }

  /**
   * 开始扫码
   */
  async function scan(): Promise<ScanCodeResult | null> {
    if (isScanning.value) return null;

    isScanning.value = true;
    error.value = null;
    result.value = null;

    try {
      const res = await new Promise<ScanCodeResult | null>((resolve, reject) => {
        uni.scanCode({
          onlyFromCamera,
          scanType,
          autoDecodeCharSet,
          success: res => {
            const scanResult: ScanCodeResult = {
              result: res.result,
              scanType: res.scanType,
              charSet: res.charSet,
              rawData: res.rawData,
            };
            resolve(scanResult);
          },
          fail: err => {
            // 用户取消扫码不算错误
            if (isUserCancel(err)) {
              resolve(null);
            } else {
              reject(new Error(err.errMsg || '扫码失败'));
            }
          },
        });
      });

      // 用户取消返回 null
      if (!res) {
        return null;
      }

      result.value = res;

      // 自动解析 URL 参数
      if (parseUrlParams && res.result) {
        const params = parseResult(res.result);
        if (Object.keys(params).length > 0) {
          result.value.params = params;
        }
      }

      return result.value;
    } catch (err) {
      error.value = err as Error;
      uni.showToast({
        title: (err as Error).message || '扫码失败',
        icon: 'none',
      });
      return null;
    } finally {
      isScanning.value = false;
    }
  }

  return {
    result,
    isScanning,
    error,
    scan,
    parseResult,
  };
}
