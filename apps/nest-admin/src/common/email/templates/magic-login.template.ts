export interface MagicLoginTemplateParams {
    loginUrl: string;
    expiresInMinutes?: number;
}

/**
 * HTML email template for magic link login.
 * Uses inline styles for broad email client support.
 */
export function renderMagicLoginEmail(
    params: MagicLoginTemplateParams
): string {
    const { loginUrl, expiresInMinutes = 5 } = params;
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录链接</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden;">
          <tr>
            <td style="padding: 36px 32px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #1f2937;">一键登录</h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #6b7280;">点击下方按钮使用本链接登录您的账号</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px 32px; text-align: center;">
              <a href="${loginUrl}" style="display: inline-block; padding: 12px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 500; border-radius: 8px;">前往登录</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 28px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">该链接 ${expiresInMinutes} 分钟内有效，若非本人操作请忽略此邮件。</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}
