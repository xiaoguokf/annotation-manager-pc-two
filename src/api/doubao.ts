import axios from "axios"

import { type ModelVO, type ModelArgVO } from "./gen/modelController"
import { ElMessage } from "element-plus"

const MAX_PIXELS = 36000000 // 豆包API最大允许的像素数
const MIN_DIMENSION = 14 // 豆包API最小允许的宽/高

/**
 * 检查并调整图片尺寸以确保符合豆包API的要求
 * @param base64Image base64编码的图片
 * @returns 调整后的base64图片
 */
async function checkAndResizeImage(base64Image: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const width = img.width
            const height = img.height
            const currentPixels = width * height

            console.log(`[Doubao] 图片尺寸: ${width}x${height} = ${currentPixels} 像素`)

            // 检查最小尺寸要求
            if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
                const errorMsg = `图片尺寸过小,最小要求 ${MIN_DIMENSION}px,当前尺寸: ${width}x${height}`
                console.error(`[Doubao] ${errorMsg}`)

                ElMessage.error(errorMsg)
                reject(new Error(errorMsg))
                return
            }

            // 如果未超过最大像素限制,直接返回原图
            if (currentPixels <= MAX_PIXELS) {
                console.log('[Doubao] 图片尺寸符合要求,无需调整')
                resolve(base64Image)
                return
            }

            // 计算缩放比例
            const scale = Math.sqrt(MAX_PIXELS / currentPixels)
            const newWidth = Math.floor(width * scale)
            const newHeight = Math.floor(height * scale)
            console.log(`[Doubao] 图片过大,缩放至: ${newWidth}x${newHeight} = ${newWidth * newHeight} 像素`)

            // 创建canvas进行缩放
            const canvas = document.createElement('canvas')
            canvas.width = newWidth
            canvas.height = newHeight
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('无法获取canvas上下文'))
                return
            }

            // 绘制缩放后的图片
            ctx.drawImage(img, 0, 0, newWidth, newHeight)

            // 转换为base64
            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.95)
            resolve(resizedBase64)
        }

        img.onerror = () => {
            ElMessage.error('图片加载失败')
            reject(new Error('图片加载失败'))
        }

        img.src = base64Image
    })
}

const doubaoHttp = axios.create({
    timeout: 30000
})

// 请求拦截器
doubaoHttp.interceptors.request.use(
    (config) => {
        console.log('[Doubao HTTP] 请求:', {
            url: config.url,
            method: config.method,
            baseURL: config.baseURL
        })
        return config
    },
    (error) => {
        console.error('[Doubao HTTP] 请求错误:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
doubaoHttp.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        console.error('[Doubao HTTP] 响应错误:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        })

        // 如果有响应数据（非200状态码），返回原始响应以便调用方处理
        if (error.response) {
            const data: DoubBaoError = error.response.data

            // 处理豆包API错误消息提示
            if (data.error) {
                const errorMessage = getDouBaoErrorMessage(data.error.code)
                ElMessage.error("OCR识别失败:" + (errorMessage ? errorMessage : data.error.message))
            }
        }

        // 如果是网络错误或超时
        if (error.code === 'ECONNABORTED') {
            ElMessage.error('OCR:请求超时，请稍后重试')
        }
        return Promise.reject(error)
    }
)

// 豆包API错误类型定义
export interface DouBaoErrorInfo {
    code: string
    message: string
    param?: string
    type: string
}

export interface DouBaoErrorResponse {
    error: DouBaoErrorInfo
}

// 豆包API错误码枚举
export enum DouBaoErrorCode {
    // 400 BadRequest
    MissingParameter = 'MissingParameter',
    InvalidParameter = 'InvalidParameter',
    InvalidEndpoint_ClosedEndpoint = 'InvalidEndpoint.ClosedEndpoint',
    SensitiveContentDetected = 'SensitiveContentDetected',
    SensitiveContentDetected_SevereViolation = 'SensitiveContentDetected.SevereViolation',
    SensitiveContentDetected_Violence = 'SensitiveContentDetected.Violence',
    InputTextSensitiveContentDetected = 'InputTextSensitiveContentDetected',
    InputImageSensitiveContentDetected = 'InputImageSensitiveContentDetected',
    InputVideoSensitiveContentDetected = 'InputVideoSensitiveContentDetected',
    InputAudioSensitiveContentDetected = 'InputAudioSensitiveContentDetected',
    OutputTextSensitiveContentDetected = 'OutputTextSensitiveContentDetected',
    OutputImageSensitiveContentDetected = 'OutputImageSensitiveContentDetected',
    OutputVideoSensitiveContentDetected = 'OutputVideoSensitiveContentDetected',
    OutputAudioSensitiveContentDetected = 'OutputAudioSensitiveContentDetected',
    InputTextSensitiveContentDetected_PolicyViolation = 'InputTextSensitiveContentDetected.PolicyViolation',
    InputImageSensitiveContentDetected_PolicyViolation = 'InputImageSensitiveContentDetected.PolicyViolation',
    InputVideoSensitiveContentDetected_PolicyViolation = 'InputVideoSensitiveContentDetected.PolicyViolation',
    InputAudioSensitiveContentDetected_PolicyViolation = 'InputAudioSensitiveContentDetected.PolicyViolation',
    InputImageSensitiveContentDetected_PrivacyInformation = 'InputImageSensitiveContentDetected.PrivacyInformation',
    InputVideoSensitiveContentDetected_PrivacyInformation = 'InputVideoSensitiveContentDetected.PrivacyInformation',
    InputTextRiskDetection = 'InputTextRiskDetection',
    InputImageRiskDetection = 'InputImageRiskDetection',
    OutputTextRiskDetection = 'OutputTextRiskDetection',
    OutputImageRiskDetection = 'OutputImageRiskDetection',
    ContentSecurityDetectionError = 'ContentSecurityDetectionError',
    InvalidArgumentError = 'InvalidArgumentError',
    InvalidImageURL_EmptyURL = 'InvalidImageURL.EmptyURL',
    InvalidImageURL_InvalidFormat = 'InvalidImageURL.InvalidFormat',
    OutofContextError = 'OutofContextError',

    // 401 Unauthorized
    AuthenticationError = 'AuthenticationError',

    // 403 Forbidden
    InvalidAccountStatus = 'InvalidAccountStatus',
    OperationDenied_InvalidState = 'OperationDenied.InvalidState',
    OperationDenied_ConflictedValidationSet = 'OperationDenied.ConflictedValidationSet',
    OperationDenied_PermissionDenied = 'OperationDenied.PermissionDenied',
    OperationDenied_UnsupportedCustomizationType = 'OperationDenied.UnsupportedCustomizationType',
    OperationDenied_CustomizationNotSupported = 'OperationDenied.CustomizationNotSupported',
    OperationDenied_ServiceNotOpen = 'OperationDenied.ServiceNotOpen',
    OperationDenied_ServiceOverdue = 'OperationDenied.ServiceOverdue',
    AccountOverdueError = 'AccountOverdueError',
    AccessDenied = 'AccessDenied',
    OperationDenied_UnsupportedPhase = 'OperationDenied.UnsupportedPhase',
    OperationDenied_FileQuotaExceeded = 'OperationDenied.FileQuotaExceeded',

    // 404 NotFound
    InvalidEndpointOrModel_NotFound = 'InvalidEndpointOrModel.NotFound',
    ModelNotOpen = 'ModelNotOpen',
    InvalidEndpointOrModel_ModelIDAccessDisabled = 'InvalidEndpointOrModel.ModelIDAccessDisabled',
    UnsupportedModel = 'UnsupportedModel',

    // 429 TooManyRequests
    RateLimitExceeded_EndpointRPMExceeded = 'RateLimitExceeded.EndpointRPMExceeded',
    RateLimitExceeded_EndpointTPMExceeded = 'RateLimitExceeded.EndpointTPMExceeded',
    ModelAccountRpmRateLimitExceeded = 'ModelAccountRpmRateLimitExceeded',
    ModelAccountTpmRateLimitExceeded = 'ModelAccountTpmRateLimitExceeded',
    APIAccountRpmRateLimitExceeded = 'APIAccountRpmRateLimitExceeded',
    ModelAccountIpmRateLimitExceeded = 'ModelAccountIpmRateLimitExceeded',
    QuotaExceeded = 'QuotaExceeded',
    ServerOverloaded = 'ServerOverloaded',
    RequestBurstTooFast = 'RequestBurstTooFast',
    SetLimitExceeded = 'SetLimitExceeded',
    InflightBatchsizeExceeded = 'InflightBatchsizeExceeded',
    AccountRateLimitExceeded = 'AccountRateLimitExceeded',

    // 500 InternalServerError
    InternalServiceError = 'InternalServiceError'
}

// 豆包API错误码中文描述映射
export const DouBaoErrorMessageMap: Record<string, string> = {
    // 400 BadRequest
    [DouBaoErrorCode.MissingParameter]: '请求缺少必要参数，请查阅 API 文档。',
    [DouBaoErrorCode.InvalidEndpoint_ClosedEndpoint]: '推理接入点处于已被关闭或暂时不可用， 请稍后重试，或联系推理接入点管理员。',
    [DouBaoErrorCode.SensitiveContentDetected]: '输入文本可能包含敏感信息，请您使用其他 prompt。',
    [DouBaoErrorCode.SensitiveContentDetected_SevereViolation]: '输入文本可能包含严重违规相关信息，请您使用其他 prompt',
    [DouBaoErrorCode.SensitiveContentDetected_Violence]: '输入文本可能包含激进行为相关信息，请您使用其他 prompt',
    [DouBaoErrorCode.InputTextSensitiveContentDetected]: '输入文本可能包含敏感信息，请您更换后重试。',
    [DouBaoErrorCode.InputImageSensitiveContentDetected]: '输入图像可能包含敏感信息，请您更换后重试。',
    [DouBaoErrorCode.InputVideoSensitiveContentDetected]: '输入视频可能包含敏感信息，请您更换后重试。',
    [DouBaoErrorCode.InputAudioSensitiveContentDetected]: '输入音频可能包含敏感信息，请您更换后重试',
    [DouBaoErrorCode.OutputTextSensitiveContentDetected]: '生成的文字可能包含敏感信息，请您更换输入内容后重试',
    [DouBaoErrorCode.OutputImageSensitiveContentDetected]: '生成的图像可能包含敏感信息，请您更换输入内容后重试。',
    [DouBaoErrorCode.OutputVideoSensitiveContentDetected]: '生成的视频可能包含敏感信息，请您更换输入内容后重试。',
    [DouBaoErrorCode.OutputAudioSensitiveContentDetected]: '生成的音频可能包含敏感信息，请您更换输入内容后重试。',
    [DouBaoErrorCode.InputTextSensitiveContentDetected_PolicyViolation]: '输入文本可能违反平台规定，请您更换后重试。',
    [DouBaoErrorCode.InputImageSensitiveContentDetected_PolicyViolation]: '输入图片可能违反平台规定，请您更换后重试。',
    [DouBaoErrorCode.InputVideoSensitiveContentDetected_PolicyViolation]: '输入视频可能违反平台规定，请您更换后重试。',
    [DouBaoErrorCode.InputAudioSensitiveContentDetected_PolicyViolation]: '输入音频可能违反平台规定，请您更换后重试。',
    [DouBaoErrorCode.InputImageSensitiveContentDetected_PrivacyInformation]: '输入图片可能包含真人，请您更换后重试。',
    [DouBaoErrorCode.InputVideoSensitiveContentDetected_PrivacyInformation]: '输入视频可能包含真人，请您更换后重试。',
    [DouBaoErrorCode.InputTextRiskDetection]: '火山引擎风险识别产品检测到输入文本可能包含敏感信息，请您更换后重试。',
    [DouBaoErrorCode.InputImageRiskDetection]: '火山引擎风险识别产品检测到输入图片可能包含敏感信息，请您更换后重试。',
    [DouBaoErrorCode.OutputTextRiskDetection]: '火山引擎风险识别产品检测到输出文本可能包含敏感信息，请您更换后重试。',
    [DouBaoErrorCode.OutputImageRiskDetection]: '火山引擎风险识别产品检测到输出图片可能包含敏感信息，请您更换后重试。',
    [DouBaoErrorCode.ContentSecurityDetectionError]: '火山引擎风险识别产品请求失败。',
    [DouBaoErrorCode.InvalidArgumentError]: '请求参数值不合法。请检查参数值的正确性后重试。',
    [DouBaoErrorCode.InvalidImageURL_EmptyURL]: '传入的图片 URL 为空',
    [DouBaoErrorCode.InvalidImageURL_InvalidFormat]: '无法解析或处理图片，可能是 Base64 格式不正确、图片数据损坏或格式不支持',
    [DouBaoErrorCode.OutofContextError]: '当请求中包含图片时，文本和图片编码后的总 token 数超过了模型上下文长度限制',

    // 401 Unauthorized
    [DouBaoErrorCode.AuthenticationError]: '请求携带的 API Key 或 AK/SK 校验未通过，请您重新检查设置的 鉴权凭证，或者查看 API 调用文档来排查问题。',

    // 403 Forbidden
    [DouBaoErrorCode.InvalidAccountStatus]: '当前使用的账号异常。',
    [DouBaoErrorCode.OperationDenied_InvalidState]: '请求所关联的Context ID处于非空闲状态，不可调用。',
    [DouBaoErrorCode.OperationDenied_ConflictedValidationSet]: '无法同时上传验证集和设置训练集取样为验证集百分比，不支持该操作。',
    [DouBaoErrorCode.OperationDenied_PermissionDenied]: '您没有权限访问基础模型的配置，不支持该操作。',
    [DouBaoErrorCode.OperationDenied_UnsupportedCustomizationType]: '模型不支持该训练方法，不支持该操作。',
    [DouBaoErrorCode.OperationDenied_CustomizationNotSupported]: '基础模型的版本不支持该训练方法，不支持该操作。',
    [DouBaoErrorCode.OperationDenied_ServiceNotOpen]: '模型服务不可用，不支持该操作。请前往火山方舟控制台激活模型服务，或提交工单联系我们。',
    [DouBaoErrorCode.OperationDenied_ServiceOverdue]: '您的账单已逾期，不支持该操作。请前往火山费用中心充值。',
    [DouBaoErrorCode.AccountOverdueError]: '当前账号欠费（余额<0），如需继续调用，请前往 火山引擎费用中心 进行充值，详细操作参见 充值操作指引。',
    [DouBaoErrorCode.AccessDenied]: '没有访问该资源的权限，请检查权限设置，或联系管理员添加白名单。',
    [DouBaoErrorCode.OperationDenied_UnsupportedPhase]: '操作失败，操作目标在特殊状态，请检查目标是否存在或者被锁定等特殊状态中。',
    [DouBaoErrorCode.OperationDenied_FileQuotaExceeded]: '当前账号已耗尽文件存储额度，如需继续使用，请删除历史文件。',

    // 404 NotFound
    [DouBaoErrorCode.InvalidEndpointOrModel_NotFound]: '模型或者推理接入点不存在或者您无权访问它。',
    [DouBaoErrorCode.ModelNotOpen]: '当前账号暂未开通模型服务，请前往火山方舟控制台开通管理页开通对应模型服务。',
    [DouBaoErrorCode.InvalidEndpointOrModel_ModelIDAccessDisabled]: '未能找到指定的模型ID。你的账号不允许使用模型ID来调用模型，请确认你账号权限或者使用有权限的推理接入点 ID 来调用模型服务。',
    [DouBaoErrorCode.UnsupportedModel]: '当前模型不支持 Coding Plan。',

    // 429 TooManyRequests
    [DouBaoErrorCode.RateLimitExceeded_EndpointRPMExceeded]: '请求所关联的推理接入点已超过 RPM (Requests Per Minute) 限制, 请稍后重试。',
    [DouBaoErrorCode.RateLimitExceeded_EndpointTPMExceeded]: '请求所关联的推理接入点已超过 TPM (Tokens Per Minute) 限制, 请稍后重试。',
    [DouBaoErrorCode.ModelAccountRpmRateLimitExceeded]: '请求已超过帐户模型 RPM (Requests Per Minute) 限制: 请您稍后重试, 或者联系平台技术同学进行解决',
    [DouBaoErrorCode.ModelAccountTpmRateLimitExceeded]: '请求已超过帐户模型 TPM (Tokens Per Minute) 限制: 请您稍后重试, 或者联系平台技术同学进行解决',
    [DouBaoErrorCode.APIAccountRpmRateLimitExceeded]: '当前账号该接口的RPM (Requests Per Minute)限制已超出，请稍后重试。',
    [DouBaoErrorCode.ModelAccountIpmRateLimitExceeded]: '请求已超过账户模型 IPM (Images Per Minute) 限制: 请您稍后重试, 或者联系平台技术同学进行解决',
    [DouBaoErrorCode.QuotaExceeded]: '当前账号对模型的免费试用额度已消耗完毕，如需继续调用，请前往火山方舟控制台开通管理页开通对应模型服务。',
    [DouBaoErrorCode.ServerOverloaded]: '服务资源紧张，请您稍后重试。',
    [DouBaoErrorCode.RequestBurstTooFast]: '请求量激增触发系统保护，请放缓流量提升速度，逐步增加请求量后再尝试',
    [DouBaoErrorCode.SetLimitExceeded]: '当前账号对模型已达到设置的推理限额值，如需继续调用，请前往火山方舟控制台开通管理页修改限额值或关闭安心体验模式。',
    [DouBaoErrorCode.InflightBatchsizeExceeded]: '您已经达到当前充值金额下的最大并发数限制，您可以充值解锁更大并发额度或降低并发数。',
    [DouBaoErrorCode.AccountRateLimitExceeded]: '请求超出RPM / TPM限制。',

    // 500 InternalServerError
    [DouBaoErrorCode.InternalServiceError]: '内部系统异常，请您稍后重试。'
}

// 根据错误码获取中文错误信息
export function getDouBaoErrorMessage(code: string): string {
    return DouBaoErrorMessageMap[code] || ``
}

// 豆包API返回数据类型定义
export interface DouBaoMessage {
    role: string
    content: string
}

export interface DouBaoChoice {
    finish_reason: string
    index: number
    logprobs: null
    message: DouBaoMessage
}

export interface DouBaoPromptTokensDetails {
    cached_tokens: number
}

export interface DouBaoCompletionTokensDetails {
    reasoning_tokens: number
}

export interface DouBaoUsage {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
    prompt_tokens_details?: DouBaoPromptTokensDetails
    completion_tokens_details?: DouBaoCompletionTokensDetails
}

export interface DouBaoResponse {
    choices: DouBaoChoice[]
    created: number
    id: string
    model: string
    service_tier: string
    object: string
    usage: DouBaoUsage
}

type DoubBaoError =
    {
        "error": {
            "code": string,
            "message": string,
            "param": string,
            "type": string
        }
    }

/**
 * 规范化公式格式：将 \( ... \) 形式的公式替换为 $ ... $
 *
 * @param text 原始文本
 * @return 规范化后的文本
 */
function normalizeFormulaFormat(text: string | null): string | null {
    if (!text) {
        return text
    }
    // Java 代码: text.replaceAll("\\\\\\((.*?)\\\\\\)", "\\$$1\\$")
    // 在 Java 字符串中，\\\\\\( 表示 \\\(（即反斜杠+括号）
    // 在 Java 中，\\$ 表示字面量的 $，所以 \\$$1\\$ 表示 $$1$
    // 在 JavaScript 中，$$ 表示字面量的 $，$1 是第一个捕获组
    return text.replace(/\\\((.*?)\\\)/g, '$$$1$')
}

/**
 * 自动填充空括号：将空的或仅含空白的中英文括号替换为 $\hspace{2em}$
 */
function fillEmptyBrackets(text: string | null): string | null {
    if (!text) return text
    return text.replace(/\((?:[ \t]*)\)|（(?:[ \t]*）)/g, (match) => {
        if (match.includes('(')) {
            return '($\\hspace{2em}$)'
        } else {
            return '（$\\hspace{2em}$）'
        }
    })
}

/**
 * 根据类型获取模型参数列表
 * @param model 模型配置
 * @param type 1-文本OCR，2-表格OCR
 * @returns 模型参数列表
 */
function getModelArg(model: ModelVO | null, type: number): ModelArgVO[] {
    if (!model || !model.args) {
        return []
    }
    return model.args.filter(arg => arg.type === type)
}

/**
 * 从模型参数中获取学科提示词（type=3，匹配extId为学科名称的参数，取其context）
 * @param model 模型配置
 * @param subject 学科名称
 * @returns 学科提示词内容，无匹配则返回空字符串
 */
function getSubjectPromptFromModel(model: ModelVO | null, subject?: string): string {
    if (!model || !model.args || !subject) return ''
    const subjectArg = model.args.find(arg => arg.type === 3 && arg.extId === subject)
    return subjectArg?.context || ''
}

export async function callDouBaoText(
    model: ModelVO,
    imageBase64: string,
    subject?: string
): Promise<{ data: DouBaoResponse }> {
    // 检查并调整图片尺寸
    const resizedImage = await checkAndResizeImage(imageBase64)

    // 获取文本OCR参数 (type=1)
    const textArgs = getModelArg(model, 1)
    if (textArgs.length === 0) {
        throw new Error('未找到文本OCR配置')
    }

    // 根据传入的学科从模型参数中获取提示词补充
    const subjectPrompt = getSubjectPromptFromModel(model, subject)

    // 构建消息
    const messages = [
        ...(textArgs.map(it => {
            return {
                role: it.role,
                content: it.context
            }
        })),
        // 如果有学科提示词，注入到system消息中
        ...(subjectPrompt ? [{
            role: 'system',
            content: subjectPrompt
        }] : []),
        {
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: {
                        url: resizedImage
                    }
                }
            ]
        }
    ]

    console.log('[Doubao] 调用文本识别，模型:', model.model, 'baseUrl:', model.baseUrl)

    const response = await doubaoHttp.post(model.baseUrl!, {
        model: model.model,
        messages: messages,
        thinking: {
            type: 'disabled'
        }
    }, {
        headers: {
            'Authorization': `Bearer ${model.apiKey}`
        }
    })

    // 规范化公式格式
    if (response.data.choices && response.data.choices.length > 0) {
        const content = response.data.choices[0].message.content
        if (content) {
            console.log('[Doubao] 原始内容:', content)
            const normalized = normalizeFormulaFormat(content)
            const filled = fillEmptyBrackets(normalized)
            console.log('[Doubao] 格式化后:', filled)
            response.data.choices[0].message.content = filled
        }
    }

    return response
}


export async function callDouBaoTable(
    model: ModelVO,
    imageBase64: string,
    subject?: string
): Promise<{ data: DouBaoResponse }> {
    // 检查并调整图片尺寸
    const resizedImage = await checkAndResizeImage(imageBase64)

    // 获取表格OCR参数 (type=2)
    const tableArgs = getModelArg(model, 2)
    if (tableArgs.length === 0) {
        throw new Error('未找到表格OCR配置')
    }

    // 根据传入的学科从模型参数中获取提示词补充
    const subjectPrompt = getSubjectPromptFromModel(model, subject)

    // 构建消息
    const messages = [
        ...(tableArgs.map(it => {
            return {
                role: it.role,
                content: it.context
            }
        })),
        // 如果有学科提示词，注入到system消息中
        ...(subjectPrompt ? [{
            role: 'system',
            content: subjectPrompt
        }] : []),
        {
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: {
                        url: resizedImage
                    }
                }
            ]
        }
    ]

    console.log('[Doubao] 调用表格识别，模型:', model.model, 'baseUrl:', model.baseUrl)

    const response = await doubaoHttp.post(model.baseUrl!, {
        model: model.model,
        messages: messages,
        thinking: {
            type: 'disabled'
        }
    }, {
        headers: {
            'Authorization': `Bearer ${model.apiKey}`
        }
    })

    // 规范化公式格式
    if (response.data.choices && response.data.choices.length > 0) {
        const content = response.data.choices[0].message.content
        if (content) {
            console.log('[Doubao] 原始内容:', content)
            const normalized = normalizeFormulaFormat(content)
            const filled = fillEmptyBrackets(normalized)
            console.log('[Doubao] 格式化后:', filled)
            response.data.choices[0].message.content = filled
        }
    }

    return response
}