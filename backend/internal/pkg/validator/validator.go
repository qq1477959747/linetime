package validator

import (
	"regexp"
	"strings"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// 常用邮箱域名白名单
var allowedEmailDomains = []string{
	// 国内邮箱
	"qq.com",
	"163.com",
	"126.com",
	"sina.com",
	"sina.cn",
	"sohu.com",
	"yeah.net",
	"139.com",
	"wo.cn",
	"189.cn",
	"aliyun.com",
	"foxmail.com",
	// 国际邮箱
	"gmail.com",
	"outlook.com",
	"hotmail.com",
	"yahoo.com",
	"icloud.com",
	"live.com",
	"msn.com",
	"aol.com",
	"protonmail.com",
	"zoho.com",
}

func IsValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}

// IsAllowedEmailDomain 检查邮箱域名是否在白名单中
func IsAllowedEmailDomain(email string) bool {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return false
	}

	domain := strings.ToLower(parts[1])
	for _, allowedDomain := range allowedEmailDomains {
		if domain == allowedDomain {
			return true
		}
	}
	return false
}

func IsValidPassword(password string) bool {
	if len(password) < 8 {
		return false
	}

	hasLetter := false
	hasDigit := false

	for _, char := range password {
		if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') {
			hasLetter = true
		}
		if char >= '0' && char <= '9' {
			hasDigit = true
		}
	}

	return hasLetter && hasDigit
}

func IsValidUsername(username string) bool {
	if len(username) < 3 || len(username) > 50 {
		return false
	}
	return true
}

func IsValidFileType(filename string, allowedTypes []string) bool {
	parts := strings.Split(filename, ".")
	if len(parts) < 2 {
		return false
	}

	ext := strings.ToLower(parts[len(parts)-1])
	for _, allowedType := range allowedTypes {
		if ext == strings.ToLower(allowedType) {
			return true
		}
	}
	return false
}
