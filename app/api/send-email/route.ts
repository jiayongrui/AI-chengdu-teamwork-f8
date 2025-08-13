import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, senderName, senderEmail } = await req.json()

    // 验证必要参数
    if (!to || !subject || !body) {
      return NextResponse.json({ error: "缺少必要参数：收件人、主题或内容" }, { status: 400 })
    }

    // 检查 API 密钥是否配置
    if (!process.env.RESEND_API_KEY) {
      console.log("RESEND_API_KEY 未配置，启用演示模式")

      // 演示模式：模拟成功发送
      const mockMessageId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 模拟发送延迟
      await new Promise((resolve) => setTimeout(resolve, 1500))

      return NextResponse.json({
        success: true,
        messageId: mockMessageId,
        message: "邮件发送成功（演示模式）",
        demo: true,
      })
    }

    // 动态导入 Resend（避免构建时错误）
    let Resend
    try {
      const resendModule = await import("resend")
      Resend = resendModule.Resend
    } catch (importError) {
      console.error("Resend 库导入失败:", importError)
      return NextResponse.json({ error: "邮件服务库加载失败" }, { status: 500 })
    }

    // 初始化 Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    // 构建邮件内容
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@example.com"
    const replyToEmail = senderEmail || fromEmail

    // 将纯文本内容转换为HTML格式
    const htmlBody = body
      .split("\n")
      .map((line: string) => {
        if (line.trim() === "") return "<br>"
        return `<p style="margin: 8px 0; line-height: 1.5;">${line.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
      })
      .join("")

    const emailData = {
      from: `${senderName || "求职者"} <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin: 0 0 10px 0;">来自简历冲鸭的求职邮件</h2>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">此邮件通过简历冲鸭平台发送</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
            ${htmlBody}
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              📧 回复此邮件将直接发送给求职者<br>
              🚀 此邮件由简历冲鸭智能求职平台生成
            </p>
          </div>
        </div>
      `,
      text: body, // 纯文本版本
      replyTo: replyToEmail,
    }

    console.log("准备发送邮件:", {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      replyTo: emailData.replyTo,
    })

    // 发送邮件
    const result = await resend.emails.send(emailData)

    console.log("Resend API 响应:", result)

    if (result.error) {
      console.error("Resend API 错误:", result.error)
      return NextResponse.json({ error: `邮件发送失败: ${result.error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
      message: "邮件发送成功",
    })
  } catch (error: any) {
    console.error("邮件发送错误:", error)

    // 提供更详细的错误信息
    let errorMessage = "邮件发送失败"
    if (error.message) {
      errorMessage += `: ${error.message}`
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
