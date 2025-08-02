import { Editor } from 'https://cdn.skypack.dev/@tiptap/core?min'
import StarterKit from 'https://cdn.skypack.dev/@tiptap/starter-kit?min'

export class BaseElement {
    constructor(data) {
        this.id = data.id || null;
        this.type = data.type;
        this.x = data.x || 100;
        this.y = data.y || 100;
        this.width = data.width || 100;
        this.height = data.height || 100;
        this.rotation = data.rotation || 0;
        this.zIndex = data.zIndex || 0;
    }

    getScreenPosition(canvas) {
        return {
            x: this.x * canvas.scale + canvas.translateX,
            y: this.y * canvas.scale + canvas.translateY,
            width: this.width * canvas.scale,
            height: this.height * canvas.scale
        };
    }

    attachEventListeners(app) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        this.element.addEventListener('mousedown', (e) => {
            if (this.type === 'text' && e.target.closest('.ProseMirror')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = this.x;
            initialY = this.y;
            
            if (!e.ctrlKey && !e.shiftKey) {
                app.selectElement(this.id);
            }
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = (e.clientX - startX) / app.canvas.scale;
            const dy = (e.clientY - startY) / app.canvas.scale;
            
            this.x = initialX + dx;
            this.y = initialY + dy;
            
            this.element.style.left = `${this.x * app.canvas.scale + app.canvas.translateX}px`;
            this.element.style.top = `${this.y * app.canvas.scale + app.canvas.translateY}px`;
            
            app.canvas.updateSelectionBox();
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                app.updateElement(this.id, { x: this.x, y: this.y });
            }
        });
        
        this.element.addEventListener('click', (e) => {
            if (!e.target.closest('.ProseMirror')) {
                app.selectElement(this.id);
            }
        });
    }
}

export class TextElement extends BaseElement {
    constructor(data) {
        super({ ...data, type: 'text' });
        this.content = data.content || '<p>Type here...</p>';
        this.fontFamily = data.fontFamily || 'Arial';
        this.fontSize = data.fontSize || '16px';
        this.color = data.color || '#000000';
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'element text-element';
        this.element.setAttribute('data-id', this.id);
        
        const screenPos = this.getScreenPosition(app.canvas);
        this.element.style.left = `${screenPos.x}px`;
        this.element.style.top = `${screenPos.y}px`;
        this.element.style.width = `${screenPos.width}px`;
        this.element.style.height = `${screenPos.height}px`;
        this.element.style.transform = `rotate(${this.rotation}deg)`;
        this.element.style.fontFamily = this.fontFamily;
        this.element.style.fontSize = this.fontSize;
        this.element.style.color = this.color;
        
        // Editor container
        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';
        this.element.appendChild(editorContainer);
        
        // Initialize editor
        this.editor = new Editor({
            element: editorContainer,
            extensions: [StarterKit],
            content: this.content,
            autofocus: false,
            editable: true,
            onUpdate: ({ editor }) => {
                this.content = editor.getHTML();
                app.history.saveState();
            }
        });
        
        container.appendChild(this.element);
    }

    attachEventListeners(app) {
        // Make element draggable
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        this.element.addEventListener('mousedown', (e) => {
            if (e.target.closest('.ProseMirror')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = this.x;
            initialY = this.y;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            this.x = initialX + dx;
            this.y = initialY + dy;
            
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            
            app.canvas.updateSelectionBox();
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                app.updateElement(this.id, { x: this.x, y: this.y });
            }
        });
        
        // Handle selection
        this.element.addEventListener('click', (e) => {
            if (!e.target.closest('.ProseMirror')) {
                app.selectElement(this.id);
            }
        });
        
        // Handle context menu
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            app.selectElement(this.id);
            app.ui.showContextMenu(e.clientX, e.clientY);
        });
        
        // Handle double-click for math equations
        if (this.type === 'math') {
            this.element.addEventListener('dblclick', () => {
                app.selectElement(this.id);
                app.ui.openToolsDrawer('math-panel');
                document.getElementById('math-latex').value = this.latex;
            });
        }
    }
}

export class ImageElement {
    constructor(data) {
        this.type = 'image';
        this.id = data.id || null;
        this.x = data.x || 100;
        this.y = data.y || 100;
        this.width = data.width || 300;
        this.height = data.height || 200;
        this.rotation = data.rotation || 0;
        this.src = data.src || '';
        this.opacity = data.opacity || 1;
        this.borderWidth = data.borderWidth || 0;
        this.borderColor = data.borderColor || '#000000';
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'element image-element';
        this.element.setAttribute('data-id', this.id);
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.transform = `rotate(${this.rotation}deg)`;
        this.element.style.opacity = this.opacity;
        
        if (this.borderWidth > 0) {
            this.element.style.border = `${this.borderWidth}px solid ${this.borderColor}`;
        }
        
        const img = document.createElement('img');
        img.src = this.src;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '4px';
        
        // Get image dimensions to adjust the container
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            
            if (aspectRatio > 1) {
                // Landscape
                this.element.style.width = `${this.width}px`;
                this.element.style.height = `${this.width / aspectRatio}px`;
            } else {
                // Portrait
                this.element.style.height = `${this.height}px`;
                this.element.style.width = `${this.height * aspectRatio}px`;
            }
        };
        
        this.element.appendChild(img);
        container.appendChild(this.element);
    }

    attachEventListeners(app) {
        // Make element draggable
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        this.element.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = this.x;
            initialY = this.y;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            this.x = initialX + dx;
            this.y = initialY + dy;
            
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            
            app.canvas.updateSelectionBox();
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                app.updateElement(this.id, { x: this.x, y: this.y });
            }
        });
        
        // Handle selection
        this.element.addEventListener('click', () => {
            app.selectElement(this.id);
        });
        
        // Handle context menu
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            app.selectElement(this.id);
            app.ui.showContextMenu(e.clientX, e.clientY);
        });
    }
}

export class ShapeElement {
    constructor(data) {
        this.type = 'shape';
        this.id = data.id || null;
        this.shape = data.shape || 'rectangle';
        this.x = data.x || 100;
        this.y = data.y || 100;
        this.width = data.width || 200;
        this.height = data.height || 150;
        this.rotation = data.rotation || 0;
        this.fillColor = data.fillColor || '#ffffff';
        this.strokeColor = data.strokeColor || '#000000';
        this.strokeWidth = data.strokeWidth || 2;
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'element shape-element';
        this.element.setAttribute('data-id', this.id);
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.transform = `rotate(${this.rotation}deg)`;
        this.element.style.backgroundColor = this.fillColor;
        this.element.style.border = `${this.strokeWidth}px solid ${this.strokeColor}`;
        
        if (this.shape === 'circle') {
            this.element.style.borderRadius = '50%';
        } else if (this.shape === 'triangle') {
            this.element.style.backgroundColor = 'transparent';
            this.element.style.border = 'none';
            
            // Create triangle using CSS
            this.element.style.width = '0';
            this.element.style.height = '0';
            this.element.style.borderLeft = `${this.width/2}px solid transparent`;
            this.element.style.borderRight = `${this.width/2}px solid transparent`;
            this.element.style.borderBottom = `${this.height}px solid ${this.fillColor}`;
        }
        
        container.appendChild(this.element);
    }

    attachEventListeners(app) {
        // Make element draggable
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        this.element.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = this.x;
            initialY = this.y;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            this.x = initialX + dx;
            this.y = initialY + dy;
            
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            
            app.canvas.updateSelectionBox();
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                app.updateElement(this.id, { x: this.x, y: this.y });
            }
        });
        
        // Handle selection
        this.element.addEventListener('click', () => {
            app.selectElement(this.id);
        });
        
        // Handle context menu
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            app.selectElement(this.id);
            app.ui.showContextMenu(e.clientX, e.clientY);
        });
    }
}

export class MathElement {
    constructor(data) {
        this.type = 'math';
        this.id = data.id || null;
        this.x = data.x || 100;
        this.y = data.y || 100;
        this.width = data.width || 200;
        this.height = data.height || 100;
        this.rotation = data.rotation || 0;
        this.latex = data.latex || '';
        this.html = data.html || '';
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'element math-element';
        this.element.setAttribute('data-id', this.id);
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.transform = `rotate(${this.rotation}deg)`;
        this.element.style.backgroundColor = 'transparent'; // Transparent background
        
        // Render math using KaTeX
        if (this.html) {
            this.element.innerHTML = this.html;
        } else if (this.latex) {
            try {
                katex.render(this.latex, this.element, {
                    throwOnError: false,
                    displayMode: true
                });
            } catch (e) {
                this.element.textContent = 'Error rendering equation';
            }
        }
        
        container.appendChild(this.element);
    }

    attachEventListeners(app) {
        // Make element draggable
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        this.element.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = this.x;
            initialY = this.y;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            this.x = initialX + dx;
            this.y = initialY + dy;
            
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            
            app.canvas.updateSelectionBox();
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                app.updateElement(this.id, { x: this.x, y: this.y });
            }
        });
        
        // Handle selection
        this.element.addEventListener('click', () => {
            app.selectElement(this.id);
        });
        
        // Handle context menu
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            app.selectElement(this.id);
            app.ui.showContextMenu(e.clientX, e.clientY);
        });
        
        // Handle double-click to edit
        this.element.addEventListener('dblclick', () => {
            app.selectElement(this.id);
            app.ui.openToolsDrawer('math-panel');
            document.getElementById('math-latex').value = this.latex;
        });
    }
}