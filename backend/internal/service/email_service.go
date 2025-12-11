package service

import (
	"fmt"
	"net/smtp"

	"github.com/qq1477959747/linetime/backend/config"
)

// EmailSender defines the interface for sending emails
type EmailSender interface {
	SendVerificationCode(to, code string) error
}

// SMTPEmailService implements EmailSender using SMTP
type SMTPEmailService struct {
	host     string
	port     int
	username string
	password string
	from     string
}

// NewSMTPEmailService creates a new SMTP email service
func NewSMTPEmailService() *SMTPEmailService {
	return &SMTPEmailService{
		host:     config.AppConfig.SMTP.Host,
		port:     config.AppConfig.SMTP.Port,
		username: config.AppConfig.SMTP.Username,
		password: config.AppConfig.SMTP.Password,
		from:     config.AppConfig.SMTP.From,
	}
}

// SendVerificationCode sends a password reset verification code email
func (s *SMTPEmailService) SendVerificationCode(to, code string) error {
	subject := "LineTime 密码重置验证码"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">LineTime 密码重置</h2>
        <p>您好，</p>
        <p>您正在重置 LineTime 账户密码。请使用以下验证码完成密码重置：</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">%s</span>
        </div>
        <p>此验证码将在 <strong>10 分钟</strong>后过期。</p>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">此邮件由 LineTime 系统自动发送，请勿回复。</p>
    </div>
</body>
</html>
`, code)

	// Build email message with display name
	msg := fmt.Sprintf("From: LineTime <%s>\r\n", s.from)
	msg += fmt.Sprintf("To: %s\r\n", to)
	msg += fmt.Sprintf("Subject: %s\r\n", subject)
	msg += "MIME-Version: 1.0\r\n"
	msg += "Content-Type: text/html; charset=UTF-8\r\n"
	msg += "\r\n"
	msg += body

	// SMTP authentication
	auth := smtp.PlainAuth("", s.username, s.password, s.host)

	// Send email
	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	err := smtp.SendMail(addr, auth, s.from, []string{to}, []byte(msg))
	if err != nil {
		return fmt.Errorf("发送邮件失败: %w", err)
	}

	return nil
}

// MockEmailService is a mock implementation for testing
type MockEmailService struct {
	SentEmails []struct {
		To   string
		Code string
	}
}

// NewMockEmailService creates a new mock email service
func NewMockEmailService() *MockEmailService {
	return &MockEmailService{}
}

// SendVerificationCode records the email instead of sending
func (s *MockEmailService) SendVerificationCode(to, code string) error {
	s.SentEmails = append(s.SentEmails, struct {
		To   string
		Code string
	}{To: to, Code: code})
	return nil
}
