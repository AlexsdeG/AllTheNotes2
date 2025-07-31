export class Canvas {
    constructor(app) {
        this.app = app;
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-container');
        this.viewport = document.getElementById('canvas-viewport');
        this.elementsContainer = document.getElementById('elements-container');
        this.selectionBox = document.getElementById('selection-box');
        
        this.isDrawing = false;
        this.isPanning = false;
        this.isResizing = false;
        this.isRotating = false;
        this.isDragging = false;
        
        this.drawingTool = 'select';
        this.drawingColor = '#000000';
        this.drawingSize = 3;
        this.currentShape = 'rectangle';
        
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;
        
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        
        this.selectedElement = null;
        this.resizeHandle = null;
        this.rotationStartAngle = 0;
        
        // Canvas size (10x larger than viewport)
        this.canvasWidth = window.innerWidth * 10;
        this.canvasHeight = window.innerHeight * 10;
        
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        // Set canvas size to 10x viewport
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        // Center the viewport
        this.translateX = -this.canvasWidth / 2 + window.innerWidth / 2;
        this.translateY = -this.canvasHeight / 2 + window.innerHeight / 2;
        
        this.updateViewportTransform();
        
        window.addEventListener('resize', () => {
            this.canvasWidth = window.innerWidth * 10;
            this.canvasHeight = window.innerHeight * 10;
            this.canvas.width = this.canvasWidth;
            this.canvas.height = this.canvasHeight;
            this.updateViewportTransform();
        });
    }

    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Context menu
        this.container.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        // Selection box events
        this.selectionBox.addEventListener('mousedown', this.handleSelectionBoxMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleSelectionBoxMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleSelectionBoxMouseUp.bind(this));
        
        // Keyboard events for panning
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' && !e.repeat) {
                e.preventDefault();
                this.startPanning();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.stopPanning();
            }
        });
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.translateX) / this.scale;
        const y = (e.clientY - rect.top - this.translateY) / this.scale;
        
        this.startX = x;
        this.startY = y;
        this.lastX = x;
        this.lastY = y;
        
        if (this.isPanning) {
            // Panning mode
            return;
        }
        
        if (this.drawingTool === 'pen' || this.drawingTool === 'eraser') {
            // Drawing mode
            this.isDrawing = true;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        } else if (this.drawingTool === 'select') {
            // Selection mode
            this.app.selectElement(null);
            
            // Check if clicked on an element
            const element = this.getElementAtPosition(e.clientX, e.clientY);
            if (element) {
                this.app.selectElement(element.id);
                this.selectedElement = element;
                
                // Start dragging
                this.isDragging = true;
                this.dragOffsetX = e.clientX - element.x;
                this.dragOffsetY = e.clientY - element.y;
            }
        } else if (this.drawingTool === 'text') {
            // Text tool - add text element at click position
            this.insertTextElementAt(x, y);
            this.app.ui.setActiveTool('select');
        } else if (this.drawingTool === 'image') {
            // Image tool - open file dialog
            this.insertImageElement();
            this.app.ui.setActiveTool('select');
        } else if (this.drawingTool === 'shape') {
            // Shape tool - start drawing shape
            this.isDrawing = true;
        } else if (this.drawingTool === 'math') {
            // Math tool - add math element at click position
            this.insertMathElementAt(x, y);
            this.app.ui.setActiveTool('select');
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.translateX) / this.scale;
        const y = (e.clientY - rect.top - this.translateY) / this.scale;
        
        if (this.isPanning) {
            // Panning mode
            this.translateX += e.movementX;
            this.translateY += e.movementY;
            this.updateViewportTransform();
            return;
        }
        
        if (this.isDrawing) {
            if (this.drawingTool === 'pen') {
                // Drawing with pen
                this.ctx.lineWidth = this.drawingSize;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.strokeStyle = this.drawingColor;
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            } else if (this.drawingTool === 'eraser') {
                // Drawing with eraser
                this.ctx.lineWidth = this.drawingSize;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            } else if (this.drawingTool === 'shape') {
                // Drawing shape
                this.redrawCanvas();
                this.drawShape(this.startX, this.startY, x, y);
            }
            
            this.lastX = x;
            this.lastY = y;
        }
        
        if (this.isDragging && this.selectedElement) {
            // Dragging element
            const element = this.app.currentPage.elements[this.selectedElement.id];
            element.x = e.clientX - this.dragOffsetX;
            element.y = e.clientY - this.dragOffsetY;
            
            this.selectedElement.element.style.left = `${element.x}px`;
            this.selectedElement.element.style.top = `${element.y}px`;
            
            this.updateSelectionBox();
        }
    }

    handleMouseUp(e) {
        if (this.isDrawing) {
            this.isDrawing = false;
            
            if (this.drawingTool === 'shape') {
                // Add shape element
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left - this.translateX) / this.scale;
                const y = (e.clientY - rect.top - this.translateY) / this.scale;
                
                const shapeElement = {
                    type: 'shape',
                    shape: this.currentShape,
                    x: Math.min(this.startX, x) * this.scale + this.translateX,
                    y: Math.min(this.startY, y) * this.scale + this.translateY,
                    width: Math.abs(x - this.startX) * this.scale,
                    height: Math.abs(y - this.startY) * this.scale,
                    rotation: 0,
                    fillColor: '#ffffff',
                    strokeColor: '#000000',
                    strokeWidth: 2
                };
                
                this.app.addElement(shapeElement);
                this.app.ui.setActiveTool('select');
            }
            
            this.app.history.saveState();
        }
        
        if (this.isDragging) {
            this.isDragging = false;
            
            if (this.selectedElement) {
                const element = this.app.currentPage.elements[this.selectedElement.id];
                this.app.updateElement(this.selectedElement.id, { x: element.x, y: element.y });
            }
        }
    }

    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate new scale
        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.1, Math.min(5, this.scale * scaleFactor));
        
        // Calculate the new translation to zoom towards the mouse position
        this.translateX = x - (x - this.translateX) * (newScale / this.scale);
        this.translateY = y - (y - this.translateY) * (newScale / this.scale);
        
        this.scale = newScale;
        this.updateViewportTransform();
    }

    handleContextMenu(e) {
        e.preventDefault();
        
        if (this.selectedElement) {
            this.app.ui.showContextMenu(e.clientX, e.clientY);
        }
    }

    handleSelectionBoxMouseDown(e) {
        e.stopPropagation();
        
        if (e.target.classList.contains('resize-handle')) {
            this.isResizing = true;
            this.resizeHandle = e.target.className.split(' ')[1];
            
            const rect = this.selectionBox.getBoundingClientRect();
            this.startWidth = rect.width;
            this.startHeight = rect.height;
        } else if (e.target.classList.contains('rotate-handle')) {
            this.isRotating = true;
            
            const rect = this.selectionBox.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            this.rotationStartAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        }
    }

    handleSelectionBoxMouseMove(e) {
        if (this.isResizing && this.selectedElement) {
            const element = this.selectedElement;
            const rect = this.selectionBox.getBoundingClientRect();
            
            let newWidth = this.startWidth;
            let newHeight = this.startHeight;
            
            if (this.resizeHandle.includes('right')) {
                newWidth = e.clientX - rect.left;
            }
            if (this.resizeHandle.includes('left')) {
                newWidth = rect.right - e.clientX;
                element.element.style.left = `${e.clientX}px`;
            }
            if (this.resizeHandle.includes('bottom')) {
                newHeight = e.clientY - rect.top;
            }
            if (this.resizeHandle.includes('top')) {
                newHeight = rect.bottom - e.clientY;
                element.element.style.top = `${e.clientY}px`;
            }
            
            // Maintain aspect ratio for images if shift is not pressed
            if (element.element.classList.contains('image-element') && !e.shiftKey) {
                const aspectRatio = this.startWidth / this.startHeight;
                if (this.resizeHandle.includes('left') || this.resizeHandle.includes('right')) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newWidth = newHeight * aspectRatio;
                }
            }
            
            element.element.style.width = `${Math.max(20, newWidth)}px`;
            element.element.style.height = `${Math.max(20, newHeight)}px`;
            
            // Update element data
            const elementData = this.app.currentPage.elements[this.selectedElement.id];
            elementData.width = parseInt(element.element.style.width);
            elementData.height = parseInt(element.element.style.height);
            
            // For text and math elements, adjust content to fit new size
            if (elementData.type === 'text' || elementData.type === 'math') {
                element.element.style.fontSize = `${Math.max(12, elementData.width / 20)}px`;
            }
            
            this.updateSelectionBox();
        } else if (this.isRotating && this.selectedElement) {
            const rect = this.selectionBox.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            const rotationAngle = currentAngle - this.rotationStartAngle;
            
            const element = this.app.currentPage.elements[this.selectedElement.id];
            element.rotation = (element.rotation || 0) + rotationAngle * (180 / Math.PI);
            
            this.selectedElement.element.style.transform = `rotate(${element.rotation}deg)`;
            this.rotationStartAngle = currentAngle;
        }
    }

    handleSelectionBoxMouseUp() {
        if (this.isResizing || this.isRotating) {
            this.isResizing = false;
            this.isRotating = false;
            
            if (this.selectedElement) {
                const element = this.app.currentPage.elements[this.selectedElement.id];
                this.app.updateElement(this.selectedElement.id, { 
                    width: element.width, 
                    height: element.height,
                    rotation: element.rotation
                });
            }
        }
    }

    getElementAtPosition(x, y) {
        const elements = document.querySelectorAll('.element');
        
        // Check from top to bottom (reverse order)
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            const rect = element.getBoundingClientRect();
            
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return {
                    id: parseInt(element.getAttribute('data-id')),
                    element: element,
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                };
            }
        }
        
        return null;
    }

    updateViewportTransform() {
        this.viewport.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }

    updateSelectionBox() {
        if (this.selectedElement) {
            const rect = this.selectedElement.element.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            this.selectionBox.style.display = 'block';
            this.selectionBox.style.left = `${rect.left - containerRect.left}px`;
            this.selectionBox.style.top = `${rect.top - containerRect.top}px`;
            this.selectionBox.style.width = `${rect.width}px`;
            this.selectionBox.style.height = `${rect.height}px`;
        } else {
            this.selectionBox.style.display = 'none';
        }
    }

    startPanning() {
        this.isPanning = true;
        this.container.style.cursor = 'grabbing';
    }

    stopPanning() {
        this.isPanning = false;
        this.container.style.cursor = 'default';
    }

    setDrawingTool(tool, shape = null) {
        this.drawingTool = tool;
        
        if (tool === 'shape' && shape) {
            this.currentShape = shape;
        }
        
        // Update cursor
        if (tool === 'pen' || tool === 'eraser') {
            this.container.style.cursor = 'crosshair';
        } else if (tool === 'pan') {
            this.container.style.cursor = 'grab';
        } else {
            this.container.style.cursor = 'default';
        }
    }

    insertTextElementAt(x, y) {
        const textElement = {
            type: 'text',
            x: x * this.scale + this.translateX,
            y: y * this.scale + this.translateY,
            width: 300,
            height: 150,
            rotation: 0,
            content: '<p>Type here...</p>'
        };
        
        this.app.addElement(textElement);
    }

    insertImageElement() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    const img = new Image();
                    
                    img.onload = () => {
                        const imageElement = {
                            type: 'image',
                            x: 100,
                            y: 100,
                            width: Math.min(500, img.width),
                            height: Math.min(500, img.height),
                            rotation: 0,
                            src: event.target.result,
                            opacity: 1,
                            borderWidth: 0,
                            borderColor: '#000000'
                        };
                        
                        this.app.addElement(imageElement);
                    };
                    
                    img.src = event.target.result;
                };
                
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

    insertMathElementAt(x, y) {
        const mathElement = {
            type: 'math',
            x: x * this.scale + this.translateX,
            y: y * this.scale + this.translateY,
            width: 200,
            height: 100,
            rotation: 0,
            latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
            html: ''
        };
        
        // Create a temporary div to render the math
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        document.body.appendChild(tempDiv);
        
        // Render the math
        katex.render(mathElement.latex, tempDiv, {
            throwOnError: false,
            displayMode: true
        });
        
        // Get the rendered HTML
        mathElement.html = tempDiv.innerHTML;
        
        // Clean up
        document.body.removeChild(tempDiv);
        
        this.app.addElement(mathElement);
    }

    insertMathElement() {
        const latex = document.getElementById('math-latex').value.trim();
        
        if (!latex) {
            this.app.ui.showToast('Please enter a LaTeX equation');
            return;
        }
        
        try {
            // Create a temporary div to render the math
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            document.body.appendChild(tempDiv);
            
            // Render the math
            katex.render(latex, tempDiv, {
                throwOnError: false,
                displayMode: true
            });
            
            // Get the rendered HTML
            const mathHtml = tempDiv.innerHTML;
            
            // Clean up
            document.body.removeChild(tempDiv);
            
            const mathElement = {
                type: 'math',
                x: 100,
                y: 100,
                width: 200,
                height: 100,
                rotation: 0,
                latex: latex,
                html: mathHtml
            };
            
            this.app.addElement(mathElement);
            
            // Clear the input
            document.getElementById('math-latex').value = '';
            
            // Close the tools drawer
            this.app.ui.closeToolsDrawer();
            
            this.app.ui.showToast('Math equation inserted');
        } catch (e) {
            this.app.ui.showToast('Error rendering math equation: ' + e.message);
        }
    }

    duplicateSelectedElement() {
        if (this.selectedElement) {
            const element = this.app.currentPage.elements[this.selectedElement.id];
            const newElement = { ...element };
            
            // Offset the new element
            newElement.x += 20;
            newElement.y += 20;
            
            this.app.addElement(newElement);
        }
    }

    bringSelectedElementToFront() {
        if (this.selectedElement) {
            const id = this.selectedElement.id;
            const element = this.app.currentPage.elements[id];
            
            // Remove from current position
            this.app.currentPage.elements.splice(id, 1);
            
            // Add to the end (front)
            this.app.currentPage.elements.push(element);
            
            // Re-render the page
            this.app.renderPage();
            
            // Re-select the element
            this.app.selectElement(this.app.currentPage.elements.length - 1);
        }
    }

    sendSelectedElementToBack() {
        if (this.selectedElement) {
            const id = this.selectedElement.id;
            const element = this.app.currentPage.elements[id];
            
            // Remove from current position
            this.app.currentPage.elements.splice(id, 1);
            
            // Add to the beginning (back)
            this.app.currentPage.elements.unshift(element);
            
            // Re-render the page
            this.app.renderPage();
            
            // Re-select the element
            this.app.selectElement(0);
        }
    }

    resetSelectedImage() {
        if (this.selectedElement) {
            const element = this.app.currentPage.elements[this.selectedElement.id];
            
            if (element.type === 'image') {
                // Reset to original dimensions
                const img = new Image();
                
                img.onload = () => {
                    element.width = Math.min(500, img.width);
                    element.height = Math.min(500, img.height);
                    element.rotation = 0;
                    element.opacity = 1;
                    element.borderWidth = 0;
                    
                    this.app.updateElement(this.selectedElement.id, element);
                };
                
                img.src = element.src;
            }
        }
    }

    drawShape(startX, startY, endX, endY) {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        
        switch (this.currentShape) {
            case 'rectangle':
                this.ctx.beginPath();
                this.ctx.rect(startX, startY, endX - startX, endY - startY);
                this.ctx.stroke();
                break;
                
            case 'circle':
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                this.ctx.beginPath();
                this.ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;
                
            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                break;
                
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.lineTo(startX - (endX - startX), endY);
                this.ctx.closePath();
                this.ctx.stroke();
                break;
        }
    }

    redrawCanvas() {
        // This would be used to redraw saved canvas content
        // For now, we'll just clear it
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}