/**
 * luch-request 类型声明
 */
declare module 'luch-request' {
  export interface HttpRequestConfig {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'HEAD' | 'OPTIONS' | 'TRACE' | 'UPLOAD' | 'DOWNLOAD';
    baseURL?: string;
    header?: Record<string, string>;
    data?: any;
    params?: Record<string, any>;
    timeout?: number;
    dataType?: string;
    responseType?: string;
    sslVerify?: boolean;
    withCredentials?: boolean;
    firstIpv4?: boolean;
    custom?: any;
    getTask?: (task: any, options: HttpRequestConfig) => void;
    validateStatus?: (statusCode: number) => boolean;
  }

  export interface HttpResponse<T = any> {
    data: T;
    statusCode: number;
    header: Record<string, string>;
    config?: HttpRequestConfig;
    errMsg?: string;
    cookies?: string[];
  }

  export interface HttpError {
    data?: any;
    header?: Record<string, string>;
    statusCode?: number;
    errMsg: string;
    config?: HttpRequestConfig;
  }

  export interface Interceptors {
    request: {
      use: (
        fulfilled?: (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>,
        rejected?: (error: any) => Promise<any>,
      ) => void;
      eject: (id: number) => void;
    };
    response: {
      use: (
        fulfilled?: (response: HttpResponse) => any | Promise<any>,
        rejected?: (error: HttpError) => Promise<any>,
      ) => void;
      eject: (id: number) => void;
    };
  }

  export default class Request {
    constructor(config?: HttpRequestConfig);
    setConfig(config: HttpRequestConfig): void;
    interceptors: Interceptors;
    request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
    get<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    post<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    put<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    delete<T = any>(url: string, data?: any, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    upload<T = any>(url: string, config?: HttpRequestConfig): Promise<HttpResponse<T>>;
    download(url: string, config?: HttpRequestConfig): Promise<UniApp.DownloadSuccessData>;
  }
}
