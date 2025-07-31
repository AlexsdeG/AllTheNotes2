export class UI {
    constructor(app) {
        this.app = app;
        this.setupEventListeners();
        this.setupTreeContextMenu();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
        
        // Toolbar buttons
        document.getElementById('undo-btn').addEventListener('click', () => this.app.history.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.app.history.redo());
        
        // Text formatting buttons
        document.getElementById('bold-btn').addEventListener('click', () => this.formatText('bold'));
        document.getElementById('italic-btn').addEventListener('click', () => this.formatText('italic'));
        document.getElementById('underline-btn').addEventListener('click', () => this.formatText('underline'));
        document.getElementById('strikethrough-btn').addEventListener('click', () => this.formatText('strikeThrough'));
        
        // Alignment buttons
        document.getElementById('align-left-btn').addEventListener('click', () => this.formatText('justifyLeft'));
        document.getElementById('align-center-btn').addEventListener('click', () => this.formatText('justifyCenter'));
        document.getElementById('align-right-btn').addEventListener('click', () => this.formatText('justifyRight'));
        
        // Font family dropdown
        document.getElementById('font-family-btn').addEventListener('click', () => {
            this.toggleDropdown('font-family-dropdown');
        });
        
        document.querySelectorAll('#font-family-dropdown .dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const font = item.getAttribute('data-font');
                this.formatText('fontName', font);
                this.toggleDropdown('font-family-dropdown');
            });
        });
        
        // Font size dropdown
        document.getElementById('font-size-btn').addEventListener('click', () => {
            this.toggleDropdown('font-size-dropdown');
        });
        
        document.querySelectorAll('#font-size-dropdown .dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const size = item.getAttribute('data-size');
                this.formatText('fontSize', size);
                this.toggleDropdown('font-size-dropdown');
            });
        });
        
        // Text color
        document.getElementById('text-color').addEventListener('change', (e) => {
            this.formatText('foreColor', e.target.value);
        });
        
        // Insert buttons
        document.getElementById('insert-select-btn').addEventListener('click', () => {
            this.setActiveTool('select');
        });
        
        document.getElementById('insert-pan-btn').addEventListener('click', () => {
            this.setActiveTool('pan');
        });
        
        document.getElementById('insert-text-btn').addEventListener('click', () => {
            this.setActiveTool('text');
        });
        
        document.getElementById('insert-image-btn').addEventListener('click', () => {
            this.setActiveTool('image');
        });
        
        document.getElementById('insert-shape-btn').addEventListener('click', () => {
            this.toggleDropdown('shape-dropdown');
        });
        
        document.querySelectorAll('#shape-dropdown .dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const shape = item.getAttribute('data-shape');
                this.setActiveTool('shape', shape);
                this.toggleDropdown('shape-dropdown');
            });
        });
        
        document.getElementById('insert-math-btn').addEventListener('click', () => {
            this.setActiveTool('math');
        });
        
        document.getElementById('draw-pen-btn').addEventListener('click', () => {
            this.setActiveTool('pen');
        });
        
        document.getElementById('draw-eraser-btn').addEventListener('click', () => {
            this.setActiveTool('eraser');
        });
        
        // Drawing options
        document.getElementById('pen-color').addEventListener('change', (e) => {
            this.app.canvas.drawingColor = e.target.value;
        });
        
        document.getElementById('pen-size').addEventListener('input', (e) => {
            this.app.canvas.drawingSize = parseInt(e.target.value);
            document.getElementById('pen-size-value').textContent = e.target.value;
        });
        
        // File operations
        document.getElementById('new-notebook-btn').addEventListener('click', () => {
            if (confirm('Create a new notebook? Unsaved changes will be lost.')) {
                this.app.newNotebook();
            }
        });
        
        document.getElementById('save-notebook-btn').addEventListener('click', () => {
            this.app.fileSystem.saveNotebook();
        });
        
        document.getElementById('load-notebook-btn').addEventListener('click', () => {
            this.app.fileSystem.loadNotebook();
        });
        
        // Shape tools
        document.getElementById('shape-fill-color').addEventListener('change', (e) => {
            this.updateSelectedElement({ fillColor: e.target.value });
        });
        
        document.getElementById('shape-stroke-color').addEventListener('change', (e) => {
            this.updateSelectedElement({ strokeColor: e.target.value });
        });
        
        document.getElementById('shape-stroke-width').addEventListener('input', (e) => {
            document.getElementById('shape-stroke-value').textContent = e.target.value;
            this.updateSelectedElement({ strokeWidth: parseInt(e.target.value) });
        });
        
        // Image tools
        document.getElementById('crop-image-btn').addEventListener('click', () => {
            this.showToast('Crop feature coming soon');
        });
        
        document.getElementById('reset-image-btn').addEventListener('click', () => {
            this.app.canvas.resetSelectedImage();
        });
        
        document.getElementById('image-opacity').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('image-opacity-value').textContent = `${value}%`;
            this.updateSelectedElement({ opacity: value / 100 });
        });
        
        document.getElementById('image-border-color').addEventListener('change', (e) => {
            this.updateSelectedElement({ borderColor: e.target.value });
        });
        
        document.getElementById('image-border-width').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('image-border-value').textContent = value;
            this.updateSelectedElement({ borderWidth: parseInt(value) });
        });
        
        // Math panel
        document.getElementById('insert-math-equation-btn').addEventListener('click', () => {
            this.app.canvas.insertMathElement();
        });
        
        // Math tabs
        document.querySelectorAll('.math-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchMathTab(tab.getAttribute('data-tab'));
            });
        });
        
        document.querySelectorAll('.symbol-btn').forEach(button => {
            button.addEventListener('click', () => {
                const symbol = button.getAttribute('data-symbol');
                const textarea = document.getElementById('math-latex');
                
                // Insert symbol at cursor position
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const before = text.substring(0, start);
                const after = text.substring(end);
                
                textarea.value = before + symbol + after;
                textarea.focus();
                textarea.setSelectionRange(start + symbol.length, start + symbol.length);
            });
        });
        
        // Tools drawer
        document.getElementById('close-tools-btn').addEventListener('click', () => {
            this.closeToolsDrawer();
        });
        
        // Context menu
        document.getElementById('context-delete').addEventListener('click', () => {
            this.app.deleteSelectedElement();
            this.hideContextMenu();
        });
        
        document.getElementById('context-duplicate').addEventListener('click', () => {
            this.app.canvas.duplicateSelectedElement();
            this.hideContextMenu();
        });
        
        document.getElementById('context-bring-front').addEventListener('click', () => {
            this.app.canvas.bringSelectedElementToFront();
            this.hideContextMenu();
        });
        
        document.getElementById('context-send-back').addEventListener('click', () => {
            this.app.canvas.sendSelectedElementToBack();
            this.hideContextMenu();
        });
        
        // Add notebook button
        document.getElementById('add-notebook-btn').addEventListener('click', () => {
            this.app.newNotebook();
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
            
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });
    }

    setupTreeContextMenu() {
        // Create context menu for tree items
        const treeContextMenu = document.createElement('div');
        treeContextMenu.className = 'context-menu';
        treeContextMenu.id = 'tree-context-menu';
        treeContextMenu.innerHTML = `
            <div class="context-menu-item" id="tree-rename">Rename</div>
            <div class="context-menu-item" id="tree-add-section">Add Section</div>
            <div class="context-menu-item" id="tree-add-page">Add Page</div>
            <div class="context-menu-item" id="tree-delete">Delete</div>
        `;
        document.body.appendChild(treeContextMenu);
        
        // Add event listeners to tree context menu
        document.getElementById('tree-rename').addEventListener('click', () => {
            if (this.treeContextTarget) {
                const { type, index } = this.treeContextTarget.dataset;
                const newName = prompt('Enter new name:');
                if (newName) {
                    this.app.renameItem(type, parseInt(index), newName);
                }
            }
            this.hideTreeContextMenu();
        });
        
        document.getElementById('tree-add-section').addEventListener('click', () => {
            this.app.addSection();
            this.hideTreeContextMenu();
        });
        
        document.getElementById('tree-add-page').addEventListener('click', () => {
            if (this.treeContextTarget) {
                const { type, index } = this.treeContextTarget.dataset;
                if (type === 'section') {
                    this.app.addPage(parseInt(index));
                } else if (type === 'notebook') {
                    this.app.addPage(0);
                }
            }
            this.hideTreeContextMenu();
        });
        
        document.getElementById('tree-delete').addEventListener('click', () => {
            if (this.treeContextTarget) {
                const { type, index } = this.treeContextTarget.dataset;
                if (confirm(`Are you sure you want to delete this ${type}?`)) {
                    this.app.deleteItem(type, parseInt(index));
                }
            }
            this.hideTreeContextMenu();
        });
    }

    showTreeContextMenu(e, target) {
        e.preventDefault();
        e.stopPropagation();
        
        this.treeContextTarget = target;
        const menu = document.getElementById('tree-context-menu');
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        menu.classList.add('show');
        
        // Show/hide menu items based on target type
        const type = target.dataset.type;
        document.getElementById('tree-add-section').style.display = type === 'notebook' ? 'block' : 'none';
        document.getElementById('tree-add-page').style.display = type === 'section' || type === 'notebook' ? 'block' : 'none';
    }

    hideTreeContextMenu() {
        document.getElementById('tree-context-menu').classList.remove('show');
        this.treeContextTarget = null;
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }

    toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        dropdown.classList.toggle('show');
        
        // Close other dropdowns
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            if (menu.id !== dropdownId) {
                menu.classList.remove('show');
            }
        });
    }

    formatText(command, value = null) {
        document.execCommand(command, false, value);
        
        // If we have a selected text element, update its content
        if (this.app.selectedElement !== null) {
            const element = this.app.currentPage.elements[this.app.selectedElement];
            if (element.type === 'text') {
                const textElement = document.querySelector(`[data-id="${this.app.selectedElement}"] .ProseMirror`);
                if (textElement) {
                    element.content = textElement.innerHTML;
                    this.app.updateElement(this.app.selectedElement, { content: element.content });
                }
            }
        }
        
        // Update formatting button states
        this.updateFormattingButtonStates();
    }

    updateFormattingButtonStates() {
        // Update bold button state
        document.getElementById('bold-btn').classList.toggle('active', document.queryCommandState('bold'));
        document.getElementById('italic-btn').classList.toggle('active', document.queryCommandState('italic'));
        document.getElementById('underline-btn').classList.toggle('active', document.queryCommandState('underline'));
        document.getElementById('strikethrough-btn').classList.toggle('active', document.queryCommandState('strikeThrough'));
    }

    setActiveTool(tool, shape = null) {
        // Reset all tool buttons
        document.querySelectorAll('.tool-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Set active tool
        this.app.currentTool = tool;
        
        if (tool === 'select') {
            document.getElementById('insert-select-btn').classList.add('active');
            this.app.canvas.setDrawingTool('select');
        } else if (tool === 'pan') {
            document.getElementById('insert-pan-btn').classList.add('active');
            this.app.canvas.setDrawingTool('pan');
        } else if (tool === 'text') {
            document.getElementById('insert-text-btn').classList.add('active');
            this.app.canvas.setDrawingTool('text');
        } else if (tool === 'image') {
            document.getElementById('insert-image-btn').classList.add('active');
            this.app.canvas.setDrawingTool('image');
        } else if (tool === 'shape') {
            document.getElementById('insert-shape-btn').classList.add('active');
            this.app.canvas.setDrawingTool('shape', shape);
        } else if (tool === 'math') {
            document.getElementById('insert-math-btn').classList.add('active');
            this.app.canvas.setDrawingTool('math');
        } else if (tool === 'pen') {
            document.getElementById('draw-pen-btn').classList.add('active');
            this.app.canvas.setDrawingTool('pen');
        } else if (tool === 'eraser') {
            document.getElementById('draw-eraser-btn').classList.add('active');
            this.app.canvas.setDrawingTool('eraser');
        }
    }

    showContextualTab(elementType) {
        // Hide all contextual tabs
        this.hideContextualTabs();
        
        // Show the relevant contextual tab
        if (elementType === 'shape') {
            document.querySelector('[data-tab="shape-tools"]').style.display = 'block';
        } else if (elementType === 'image') {
            document.querySelector('[data-tab="image-tools"]').style.display = 'block';
        }
    }

    hideContextualTabs() {
        document.querySelectorAll('.contextual-tab').forEach(tab => {
            tab.style.display = 'none';
        });
    }

    updateSelectedElement(updates) {
        if (this.app.selectedElement !== null) {
            this.app.updateElement(this.app.selectedElement, updates);
            this.app.renderPage();
            this.app.selectElement(this.app.selectedElement);
        }
    }

    openToolsDrawer(panelId) {
        const drawer = document.getElementById('tools-drawer');
        drawer.classList.add('open');
        
        // Show the requested panel
        document.querySelectorAll('.tools-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        document.getElementById(panelId).style.display = 'block';
    }

    closeToolsDrawer() {
        document.getElementById('tools-drawer').classList.remove('open');
    }

    switchMathTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.math-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Update tab panels
        document.querySelectorAll('.math-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabId}-panel`).classList.add('active');
    }

    showContextMenu(x, y) {
        const menu = document.getElementById('context-menu');
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.classList.add('show');
    }

    hideContextMenu() {
        document.getElementById('context-menu').classList.remove('show');
    }

    showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    renderNotebooksTree() {
        const treeContainer = document.getElementById('notebooks-tree');
        treeContainer.innerHTML = '';
        
        // Render notebook
        const notebookEl = document.createElement('div');
        notebookEl.className = 'notebook-item active';
        notebookEl.innerHTML = `
            <div class="item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
            </div>
            <div class="item-title" data-type="notebook" data-index="0">${this.app.notebook.name}</div>
            <div class="item-actions">
                <button class="action-btn add-section-btn" title="Add Section">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                </button>
            </div>
        `;
        
        // Add event listeners for notebook
        notebookEl.querySelector('.add-section-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.app.addSection();
        });
        
        notebookEl.addEventListener('contextmenu', (e) => {
            this.showTreeContextMenu(e, notebookEl.querySelector('.item-title'));
        });
        
        treeContainer.appendChild(notebookEl);
        
        // Render sections
        this.app.notebook.sections.forEach((section, sectionIndex) => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'section-item';
            if (section === this.app.currentSection) {
                sectionEl.classList.add('active');
            }
            
            sectionEl.innerHTML = `
                <div class="item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                    </svg>
                </div>
                <div class="item-title" data-type="section" data-index="${sectionIndex}">${section.name}</div>
                <div class="item-actions">
                    <button class="action-btn add-page-btn" title="Add Page">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                    </button>
                    <button class="action-btn delete-section-btn" title="Delete Section">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // Add event listeners for section
            sectionEl.querySelector('.add-page-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.app.addPage(sectionIndex);
            });
            
            sectionEl.querySelector('.delete-section-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this section and all its pages?')) {
                    this.app.deleteItem('section', sectionIndex);
                }
            });
            
            sectionEl.addEventListener('contextmenu', (e) => {
                this.showTreeContextMenu(e, sectionEl.querySelector('.item-title'));
            });
            
            sectionEl.addEventListener('click', (e) => {
                if (!e.target.closest('.item-actions')) {
                    this.app.currentSection = section;
                    this.app.currentPage = section.pages[0];
                    this.app.selectedElement = null;
                    this.renderNotebooksTree();
                    this.app.renderPage();
                    this.app.history.clear();
                }
            });
            
            treeContainer.appendChild(sectionEl);
            
            // Render pages
            section.pages.forEach((page, pageIndex) => {
                const pageEl = document.createElement('div');
                pageEl.className = 'page-item';
                if (section === this.app.currentSection && page === this.app.currentPage) {
                    pageEl.classList.add('active');
                }
                
                pageEl.innerHTML = `
                    <div class="item-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <div class="item-title" data-type="page" data-index="${pageIndex}">${page.name}</div>
                    <div class="item-actions">
                        <button class="action-btn delete-page-btn" title="Delete Page">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                        </button>
                    </div>
                `;
                
                // Add event listeners for page
                pageEl.querySelector('.delete-page-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to delete this page?')) {
                        this.app.deleteItem('page', pageIndex);
                    }
                });
                
                pageEl.addEventListener('contextmenu', (e) => {
                    this.showTreeContextMenu(e, pageEl.querySelector('.item-title'));
                });
                
                pageEl.addEventListener('click', (e) => {
                    if (!e.target.closest('.item-actions')) {
                        this.app.selectPage(sectionIndex, pageIndex);
                    }
                });
                
                treeContainer.appendChild(pageEl);
            });
        });
    }

    getCurrentSectionIndex() {
        return this.app.notebook.sections.findIndex(section => section === this.app.currentSection);
    }
}