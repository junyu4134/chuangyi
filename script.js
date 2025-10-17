class SubtitleGenerator {
    constructor() {
        this.backgroundImage = null;
        this.settings = {
            subtitleHeight: 60,
            fontSize: 40,
            fontColor: '#030303',
            outlineColor: '#ffffff',  // 默认轮廓颜色改为白色
            fontFamily: '衣冠体',
            fontWeight: '400',
            text: ''  // 默认字幕内容为空白
        };
        
        this.initElements();
        this.bindEvents();
        this.updateCharCount();
    }

    initElements() {
        // 获取所有DOM元素
        this.elements = {
            subtitleHeight: document.getElementById('subtitle-height'),
            fontSize: document.getElementById('font-size'),
            fontColor: document.getElementById('font-color'),
            fontColorText: document.getElementById('font-color-text'),
            outlineColor: document.getElementById('outline-color'),
            outlineColorText: document.getElementById('outline-color-text'),
            fontFamily: document.getElementById('font-family'),
            fontWeight: document.getElementById('font-weight'),
            subtitleText: document.getElementById('subtitle-text'),
            charCount: document.getElementById('char-count'),
            generateBtn: document.getElementById('generate-btn'),
            saveBtn: document.getElementById('save-btn'),
            uploadArea: document.getElementById('upload-area'),
            imageInput: document.getElementById('image-input'),
            previewCanvas: document.getElementById('preview-canvas'),
            exportCanvas: document.getElementById('export-canvas')
        };

        // 设置默认文本
        this.elements.subtitleText.value = '';  // 默认字幕内容为空白
        this.settings.text = this.elements.subtitleText.value;
    }

    bindEvents() {
        // 数值输入事件
        this.elements.subtitleHeight.addEventListener('input', (e) => {
            this.settings.subtitleHeight = parseInt(e.target.value);
            this.updatePreview();
        });

        this.elements.fontSize.addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            this.updatePreview();
        });

        // 颜色选择事件
        this.elements.fontColor.addEventListener('input', (e) => {
            this.settings.fontColor = e.target.value;
            this.elements.fontColorText.value = e.target.value;
            this.updatePreview();
        });

        this.elements.fontColorText.addEventListener('input', (e) => {
            if (this.isValidHexColor(e.target.value)) {
                this.settings.fontColor = e.target.value;
                this.elements.fontColor.value = e.target.value;
                this.updatePreview();
            }
        });

        this.elements.outlineColor.addEventListener('input', (e) => {
            this.settings.outlineColor = e.target.value;
            this.elements.outlineColorText.value = e.target.value;
            this.updatePreview();
        });

        this.elements.outlineColorText.addEventListener('input', (e) => {
            if (this.isValidHexColor(e.target.value)) {
                this.settings.outlineColor = e.target.value;
                this.elements.outlineColor.value = e.target.value;
                this.updatePreview();
            }
        });

        // 字体设置事件
        this.elements.fontFamily.addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.updatePreview();
        });

        this.elements.fontWeight.addEventListener('change', (e) => {
            this.settings.fontWeight = e.target.value;
            this.updatePreview();
        });

        // 文本输入事件
        this.elements.subtitleText.addEventListener('input', (e) => {
            this.settings.text = e.target.value;
            this.updateCharCount();
            this.updatePreview();
        });

        // 文件上传事件
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.imageInput.click();
        });

        this.elements.imageInput.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // 拖拽上传事件
        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.add('dragover');
        });

        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.classList.remove('dragover');
        });

        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload(file);
            }
        });

        // 按钮事件
        this.elements.generateBtn.addEventListener('click', () => {
            this.generateImage();
        });

        this.elements.saveBtn.addEventListener('click', () => {
            this.saveImage();
        });
    }

    isValidHexColor(hex) {
        return /^#[0-9A-F]{6}$/i.test(hex);
    }

    updateCharCount() {
        const count = this.elements.subtitleText.value.length;
        this.elements.charCount.textContent = count;
        
        if (count > 1000) {
            this.elements.charCount.style.color = '#dc3545';
        } else {
            this.elements.charCount.style.color = '#6c757d';
        }
    }

    handleImageUpload(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('请选择有效的图片文件！');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('图片文件大小不能超过10MB！');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                this.elements.uploadArea.style.display = 'none';
                this.elements.previewCanvas.style.display = 'block';
                this.updatePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    updatePreview() {
        if (!this.backgroundImage) return;

        const canvas = this.elements.previewCanvas;
        const ctx = canvas.getContext('2d');
        
        // 设置画布尺寸
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = this.backgroundImage;
        
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制背景图片
        ctx.drawImage(this.backgroundImage, 0, 0, width, height);
        
        // 绘制字幕
        this.drawSubtitles(ctx, width, height);
    }

    drawSubtitles(ctx, canvasWidth, canvasHeight) {
        if (!this.settings.text.trim()) return;

        const lines = this.settings.text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        // 设置字体
        ctx.font = `${this.settings.fontWeight} ${this.settings.fontSize}px ${this.settings.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 计算字幕区域
        const subtitleHeight = this.settings.subtitleHeight;
        const totalHeight = lines.length * subtitleHeight;
        const startY = canvasHeight - totalHeight;

        lines.forEach((line, index) => {
            const y = startY + (index * subtitleHeight);
            
            // 创建背景条 - 使用背景图片的底部切片作为背景
            this.drawSubtitleBackground(ctx, canvasWidth, canvasHeight, y, subtitleHeight, index, lines.length);
            
            // 绘制文字描边
            ctx.strokeStyle = this.settings.outlineColor;
            ctx.lineWidth = 3;
            ctx.strokeText(line, canvasWidth / 2, y + subtitleHeight / 2);
            
            // 绘制文字
            ctx.fillStyle = this.settings.fontColor;
            ctx.fillText(line, canvasWidth / 2, y + subtitleHeight / 2);
        });
    }

    drawSubtitleBackground(ctx, canvasWidth, canvasHeight, y, subtitleHeight, lineIndex, totalLines) {
        // 保存当前状态
        ctx.save();
        
        // 计算缩放比例
        const scaleX = this.backgroundImage.width / canvasWidth;
        const scaleY = this.backgroundImage.height / canvasHeight;
        
        // 创建临时画布来处理背景切片
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvasWidth;
        tempCanvas.height = subtitleHeight;
        
        // 从背景图片的底部切取图片条（固定从底部切取）
        const bottomY = this.backgroundImage.height - (subtitleHeight * scaleY);
        
        // 从原始背景图片的底部切取条带
        tempCtx.drawImage(
            this.backgroundImage,
            0, bottomY,  // 从背景图底部开始切取
            this.backgroundImage.width, subtitleHeight * scaleY,  // 源图片的宽度和高度
            0, 0,  // 目标位置
            canvasWidth, subtitleHeight  // 目标尺寸
        );
        
        // 在切取的图片条上叠加41%透明度的黑色遮罩
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.fillStyle = 'rgba(0, 0, 0, 0.41)';
        tempCtx.fillRect(0, 0, canvasWidth, subtitleHeight);
        
        // 将处理后的背景条绘制到主画布的字幕位置
        ctx.drawImage(tempCanvas, 0, y);
        
        // 恢复状态
        ctx.restore();
    }

    generateImage() {
        if (!this.backgroundImage) {
            alert('请先上传背景图片！');
            return;
        }

        this.elements.generateBtn.disabled = true;
        this.elements.generateBtn.innerHTML = '<span class="loading"></span> 生成中...';

        setTimeout(() => {
            const canvas = this.elements.exportCanvas;
            const ctx = canvas.getContext('2d');
            
            // 使用原始图片尺寸
            canvas.width = this.backgroundImage.width;
            canvas.height = this.backgroundImage.height;
            
            // 绘制背景图片
            ctx.drawImage(this.backgroundImage, 0, 0);
            
            // 绘制字幕
            this.drawSubtitles(ctx, canvas.width, canvas.height);
            
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.innerHTML = '生成字幕图片';
            this.elements.saveBtn.disabled = false;
            
            this.showSuccessMessage('字幕图片生成成功！');
        }, 1000);
    }

    saveImage() {
        if (!this.backgroundImage) {
            alert('请先生成字幕图片！');
            return;
        }

        const canvas = this.elements.exportCanvas;
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        link.download = `subtitle-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        this.showSuccessMessage('图片保存成功！');
    }

    showSuccessMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'success-message';
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new SubtitleGenerator();
});