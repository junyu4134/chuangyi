class SubtitleGenerator {
    constructor() {
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.backgroundImage = null;
        this.backgroundCanvas = null; // 缓存背景画布
        this.renderTimeout = null; // 防抖定时器
        this.settings = {
            subtitleHeight: 60,
            fontSize: 40,
            fontColor: '#030303',
            outlineColor: '#000000',
            fontFamily: '衣冠体',
            fontWeight: '400',
            content: ''
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCharCount();
        this.setupColorPickers();
    }

    bindEvents() {
        // 设置项变化监听 - 添加防抖处理
        document.getElementById('subtitle-height').addEventListener('input', (e) => {
            this.settings.subtitleHeight = parseInt(e.target.value);
            this.debouncedRender();
        });

        document.getElementById('font-size').addEventListener('input', (e) => {
            this.settings.fontSize = parseInt(e.target.value);
            this.debouncedRender();
        });

        document.getElementById('font-color').addEventListener('change', (e) => {
            this.settings.fontColor = e.target.value;
            document.getElementById('font-color-text').value = e.target.value;
            document.getElementById('font-color-preview').style.backgroundColor = e.target.value;
            this.debouncedRender();
        });

        document.getElementById('font-color-text').addEventListener('input', (e) => {
            if (this.isValidHexColor(e.target.value)) {
                this.settings.fontColor = e.target.value;
                document.getElementById('font-color').value = e.target.value;
                document.getElementById('font-color-preview').style.backgroundColor = e.target.value;
                this.debouncedRender();
            }
        });

        document.getElementById('outline-color').addEventListener('change', (e) => {
            this.settings.outlineColor = e.target.value;
            document.getElementById('outline-color-text').value = e.target.value;
            document.getElementById('outline-color-preview').style.backgroundColor = e.target.value;
            this.debouncedRender();
        });

        document.getElementById('outline-color-text').addEventListener('input', (e) => {
            if (this.isValidHexColor(e.target.value)) {
                this.settings.outlineColor = e.target.value;
                document.getElementById('outline-color').value = e.target.value;
                document.getElementById('outline-color-preview').style.backgroundColor = e.target.value;
                this.debouncedRender();
            }
        });

        document.getElementById('font-family').addEventListener('change', (e) => {
            this.settings.fontFamily = e.target.value;
            this.debouncedRender();
        });

        document.getElementById('font-weight').addEventListener('change', (e) => {
            this.settings.fontWeight = e.target.value;
            this.debouncedRender();
        });

        document.getElementById('subtitle-content').addEventListener('input', (e) => {
            this.settings.content = e.target.value;
            this.updateCharCount();
            this.debouncedRender();
        });

        // 文件上传相关
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // 颜色预览点击事件
        document.getElementById('font-color-preview').addEventListener('click', () => {
            document.getElementById('font-color').click();
        });

        document.getElementById('outline-color-preview').addEventListener('click', () => {
            document.getElementById('outline-color').click();
        });

        // 按钮事件
        document.getElementById('generate-btn').addEventListener('click', this.generateSubtitleImage.bind(this));
        document.getElementById('save-btn').addEventListener('click', this.saveImage.bind(this));
    }

    setupColorPickers() {
        // 设置初始颜色预览
        document.getElementById('font-color-preview').style.backgroundColor = this.settings.fontColor;
        document.getElementById('outline-color-preview').style.backgroundColor = this.settings.outlineColor;
    }

    // 防抖渲染函数
    debouncedRender() {
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
        }
        this.renderTimeout = setTimeout(() => {
            this.renderPreview();
        }, 100); // 100ms 防抖延迟
    }

    isValidHexColor(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    updateCharCount() {
        const content = document.getElementById('subtitle-content').value;
        const count = content.length;
        document.getElementById('char-count').textContent = count;
        
        if (count > 1000) {
            document.getElementById('char-count').style.color = '#dc3545';
        } else {
            document.getElementById('char-count').style.color = '#6c757d';
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('upload-area').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('upload-area').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('upload-area').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.loadImage(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件！');
            return;
        }

        // 验证文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('文件大小不能超过10MB！');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.backgroundImage = img;
                this.setupCanvas();
                this.createBackgroundCache(); // 创建背景缓存
                this.renderPreview();
                
                // 显示预览区域，隐藏上传区域
                document.getElementById('upload-area').style.display = 'none';
                document.getElementById('preview-area').style.display = 'flex';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    setupCanvas() {
        if (!this.backgroundImage) return;

        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = this.backgroundImage;
        
        // 等比例缩放
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    // 创建背景缓存
    createBackgroundCache() {
        if (!this.backgroundImage) return;
        
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCanvas.width = this.canvas.width;
        this.backgroundCanvas.height = this.canvas.height;
        
        const bgCtx = this.backgroundCanvas.getContext('2d');
        bgCtx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    }

    renderPreview() {
        if (!this.backgroundImage || !this.backgroundCanvas) return;

        const { width, height } = this.canvas;
        
        // 清空画布
        this.ctx.clearRect(0, 0, width, height);
        
        // 使用缓存的背景
        this.ctx.drawImage(this.backgroundCanvas, 0, 0);
        
        // 绘制字幕
        this.drawSubtitles();
    }

    drawSubtitles() {
        const content = this.settings.content.trim();
        if (!content) return;

        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        const { width, height } = this.canvas;
        const subtitleHeight = this.settings.subtitleHeight;
        const fontSize = this.settings.fontSize;
        
        // 设置字体
        this.ctx.font = `${this.settings.fontWeight} ${fontSize}px ${this.settings.fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 计算总字幕区域高度
        const totalSubtitleHeight = lines.length * subtitleHeight;
        
        // 从底部开始绘制
        const startY = height - totalSubtitleHeight;

        // 创建一次性的背景条纹
        this.createOptimizedBackgroundStrip(startY, totalSubtitleHeight);

        lines.forEach((line, index) => {
            const y = startY + index * subtitleHeight;
            
            // 绘制文字描边
            this.ctx.strokeStyle = this.settings.outlineColor;
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(line, width / 2, y + subtitleHeight / 2);
            
            // 绘制文字
            this.ctx.fillStyle = this.settings.fontColor;
            this.ctx.fillText(line, width / 2, y + subtitleHeight / 2);
        });
    }

    // 优化的背景条纹创建 - 一次性处理整个字幕区域
    createOptimizedBackgroundStrip(startY, height) {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width;
        
        // 获取整个字幕区域的图像数据
        const imageData = ctx.getImageData(0, startY, canvasWidth, height);
        const data = imageData.data;
        
        // 批量处理像素，添加半透明效果
        for (let i = 0; i < data.length; i += 4) {
            // 降低亮度并增加透明度
            data[i] = Math.floor(data[i] * 0.3);     // R
            data[i + 1] = Math.floor(data[i + 1] * 0.3); // G
            data[i + 2] = Math.floor(data[i + 2] * 0.3); // B
            // Alpha 保持不变
        }
        
        // 一次性写回整个区域
        ctx.putImageData(imageData, 0, startY);
    }

    async generateSubtitleImage() {
        if (!this.backgroundImage) {
            alert('请先上传背景图片！');
            return;
        }

        this.showLoading();

        try {
            // 创建高分辨率画布
            const outputCanvas = document.createElement('canvas');
            const outputCtx = outputCanvas.getContext('2d');
            
            // 使用原始图片尺寸
            outputCanvas.width = this.backgroundImage.naturalWidth;
            outputCanvas.height = this.backgroundImage.naturalHeight;
            
            // 绘制原始尺寸的图片
            outputCtx.drawImage(this.backgroundImage, 0, 0);
            
            // 计算缩放比例
            const scaleX = this.backgroundImage.naturalWidth / this.canvas.width;
            const scaleY = this.backgroundImage.naturalHeight / this.canvas.height;
            
            // 绘制高分辨率字幕
            this.drawHighResSubtitles(outputCtx, outputCanvas.width, outputCanvas.height, scaleX, scaleY);
            
            // 更新预览
            this.canvas.width = outputCanvas.width;
            this.canvas.height = outputCanvas.height;
            this.ctx.drawImage(outputCanvas, 0, 0);
            
            // 重新调整显示尺寸
            this.setupCanvas();
            
            setTimeout(() => {
                this.hideLoading();
                alert('字幕图片生成完成！');
            }, 1000);
            
        } catch (error) {
            console.error('生成图片时出错:', error);
            this.hideLoading();
            alert('生成图片时出错，请重试！');
        }
    }

    drawHighResSubtitles(ctx, width, height, scaleX, scaleY) {
        const content = this.settings.content.trim();
        if (!content) return;

        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        const subtitleHeight = this.settings.subtitleHeight * scaleY;
        const fontSize = this.settings.fontSize * scaleX;
        
        // 设置字体
        ctx.font = `${this.settings.fontWeight} ${fontSize}px ${this.settings.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 计算总字幕区域高度
        const totalSubtitleHeight = lines.length * subtitleHeight;
        
        // 从底部开始绘制
        const startY = height - totalSubtitleHeight;

        lines.forEach((line, index) => {
            const y = startY + index * subtitleHeight;
            
            // 创建背景条效果
            this.createHighResBackgroundStrip(ctx, y, subtitleHeight, height, width);
            
            // 绘制文字描边
            ctx.strokeStyle = this.settings.outlineColor;
            ctx.lineWidth = 3 * scaleX;
            ctx.strokeText(line, width / 2, y + subtitleHeight / 2);
            
            // 绘制文字
            ctx.fillStyle = this.settings.fontColor;
            ctx.fillText(line, width / 2, y + subtitleHeight / 2);
        });
    }

    createHighResBackgroundStrip(ctx, y, stripHeight, canvasHeight, canvasWidth) {
        // 获取背景图片底部的像素数据
        const sourceY = Math.max(0, canvasHeight - stripHeight);
        const imageData = ctx.getImageData(0, sourceY, canvasWidth, stripHeight);
        
        // 创建半透明效果
        const data = imageData.data;
        for (let i = 3; i < data.length; i += 4) {
            data[i] = data[i] * 0.7; // 70% 透明度
        }
        
        // 绘制背景条
        ctx.putImageData(imageData, 0, y);
    }

    saveImage() {
        if (!this.backgroundImage) {
            alert('请先生成字幕图片！');
            return;
        }

        try {
            // 创建下载链接
            const link = document.createElement('a');
            link.download = `subtitle_${new Date().getTime()}.png`;
            link.href = this.canvas.toDataURL('image/png');
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('保存图片时出错:', error);
            alert('保存图片时出错，请重试！');
        }
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new SubtitleGenerator();
});