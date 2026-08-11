import type { ApiResponse } from '@stack-forge/contracts'
import type { Method } from 'alova'
import router from '@/router'

export class ApiError extends Error {
  code: number
  data?: unknown

  constructor(message: string, code: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
  }
}

export async function handleAlovaResponse(
  response: UniApp.RequestSuccessCallbackResult | UniApp.UploadFileSuccessCallbackResult | UniApp.DownloadSuccessData,
) {
  const globalToast = useGlobalToast()
  const { statusCode, data } = response as UniNamespace.RequestSuccessCallbackResult

  if (statusCode === 401 || statusCode === 403) {
    globalToast.error({ msg: '登录已过期，请重新登录！', duration: 500 })
    const timer = setTimeout(() => {
      clearTimeout(timer)
      router.replaceAll({ name: 'home' })
    }, 500)

    throw new ApiError('登录已过期，请重新登录！', statusCode, data)
  }

  if (statusCode >= 400) {
    globalToast.error(`请求失败，状态码：${statusCode}`)
    throw new ApiError(`Request failed with status: ${statusCode}`, statusCode, data)
  }

  const json = data as ApiResponse<unknown>

  if (import.meta.env.MODE === 'development') {
    console.log('[Alova Response]', json)
  }

  if (json.code !== 200) {
    globalToast.error(json.message || '请求失败')
    throw new ApiError(json.message || '请求失败', json.code, json.data)
  }

  return json.data
}

export function handleAlovaError(error: unknown, method: Method) {
  const globalToast = useGlobalToast()

  if (import.meta.env.MODE === 'development') {
    console.error('[Alova Error]', error, method)
  }

  if (error instanceof ApiError && (error.code === 401 || error.code === 403)) {
    globalToast.error({ msg: '登录已过期，请重新登录！', duration: 500 })
    throw error
  }

  if (error instanceof Error && error.name === 'NetworkError') {
    globalToast.error('网络错误，请检查您的网络连接')
  }
  else if (error instanceof Error && error.name === 'TimeoutError') {
    globalToast.error('请求超时，请重试')
  }
  else if (error instanceof ApiError) {
    globalToast.error(error.message || '请求失败')
  }
  else {
    globalToast.error('发生意外错误')
  }

  throw error
}
