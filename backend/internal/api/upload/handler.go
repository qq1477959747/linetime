package upload

import (
	"github.com/gin-gonic/gin"
	"github.com/qq1477959747/linetime/backend/internal/pkg/response"
	"github.com/qq1477959747/linetime/backend/internal/service"
)

type Handler struct {
	uploadService *service.UploadService
}

func NewHandler(uploadService *service.UploadService) *Handler {
	return &Handler{uploadService: uploadService}
}

// UploadImage 上传单张图片
func (h *Handler) UploadImage(c *gin.Context) {
	// 获取上传的文件
	file, err := c.FormFile("image")
	if err != nil {
		response.BadRequest(c, "请选择要上传的图片")
		return
	}

	// 上传图片
	result, err := h.uploadService.UploadImage(c.Request.Context(), file)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, result)
}

// UploadImages 批量上传图片
func (h *Handler) UploadImages(c *gin.Context) {
	// 获取多个文件
	form, err := c.MultipartForm()
	if err != nil {
		response.BadRequest(c, "请选择要上传的图片")
		return
	}

	files := form.File["images"]
	if len(files) == 0 {
		response.BadRequest(c, "请选择要上传的图片")
		return
	}

	// 批量上传
	results, err := h.uploadService.UploadImages(c.Request.Context(), files)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, results)
}
