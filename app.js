import { UI } from './ui.js';
import { Canvas } from './canvas.js';
import { HistoryManager } from './history.js';
import { FileSystem } from './filesystem.js';
import { TextElement, ImageElement, ShapeElement, MathElement } from './elements.js';

class OneNoteApp {
    constructor() {
        this.notebook = {
            name: "My Notebook",
            sections: [
                {
                    name: "Section 1",
                    pages: [
                        { name: "Page 1", elements: [] }
                    ]
                }
            ]
        };
        
        this.currentSection = this.notebook.sections[0];
        this.currentPage = this.currentSection.pages[0];
        this.selectedElement = null;
        this.currentTool = 'select';
        
        this.init();
    }

    init() {
        // Initialize UI
        this.ui = new UI(this);
        this.ui.renderNotebooksTree();
        
        // Initialize Canvas
        this.canvas = new Canvas(this);
        
        // Initialize History Manager
        this.history = new HistoryManager(this);
        
        // Initialize File System
        this.fileSystem = new FileSystem(this);
        
        // Load saved state from localStorage if available
        this.loadFromLocalStorage();
        
        // Save state periodically
        setInterval(() => this.saveToLocalStorage(), 30000);
        
        // Save state on window close
        window.addEventListener('beforeunload', () => {
            this.saveToLocalStorage();
        });
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z: Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.history.undo();
            }
            
            // Ctrl/Cmd + Shift + Z: Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                this.history.redo();
            }
            
            // Ctrl/Cmd + S: Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.fileSystem.saveNotebook();
            }
            
            // Delete key: Delete selected element
            if (e.key === 'Delete' && this.selectedElement) {
                e.preventDefault();
                this.deleteSelectedElement();
            }
            
            // Spacebar: Start panning
            if (e.key === ' ' && !e.repeat) {
                e.preventDefault();
                this.canvas.startPanning();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            // Spacebar: Stop panning
            if (e.key === ' ') {
                e.preventDefault();
                this.canvas.stopPanning();
            }
        });
    }

    saveToLocalStorage() {
        try {
            // localStorage.setItem('onenote-clone', JSON.stringify(this.notebook));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    loadFromLocalStorage() {
        try {
            const savedNotebook = localStorage.getItem('onenote-clone');
            if (savedNotebook) {
                this.notebook = JSON.parse(savedNotebook);
                this.currentSection = this.notebook.sections[0];
                this.currentPage = this.currentSection.pages[0];
                this.ui.renderNotebooksTree();
                this.renderPage();
            }
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
        }
    }

    renderPage() {
        // Clear existing elements
        const container = document.getElementById('elements-container');
        container.innerHTML = '';
        
        // Render all elements for the current page
        this.currentPage.elements.forEach((elementData, index) => {
            let element;
            
            switch (elementData.type) {
                case 'text':
                    element = new TextElement(elementData);
                    break;
                case 'image':
                    element = new ImageElement(elementData);
                    break;
                case 'shape':
                    element = new ShapeElement(elementData);
                    break;
                case 'math':
                    element = new MathElement(elementData);
                    break;
            }
            
            if (element) {
                element.id = index;
                element.render(container);
                element.attachEventListeners(this);
            }
        });
        
        // Clear canvas
        this.canvas.clear();
        
        // Save initial state
        this.history.saveState();
    }

    addElement(elementData) {
        this.currentPage.elements.push(elementData);
        this.history.saveState();
        this.renderPage();
    }

    updateElement(id, updates) {
        if (id >= 0 && id < this.currentPage.elements.length) {
            Object.assign(this.currentPage.elements[id], updates);
            this.history.saveState();
        }
    }

    deleteSelectedElement() {
        if (this.selectedElement !== null) {
            this.currentPage.elements.splice(this.selectedElement, 1);
            this.selectedElement = null;
            this.history.saveState();
            this.renderPage();
        }
    }

    selectElement(id) {
        this.selectedElement = id;
        
        // Update UI to show selected element
        document.querySelectorAll('.element').forEach(el => {
            el.classList.remove('selected');
        });
        
        if (id !== null) {
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.classList.add('selected');
                
                // Show contextual tab based on element type
                const elementType = this.currentPage.elements[id].type;
                this.ui.showContextualTab(elementType);
            }
        } else {
            // Hide contextual tabs
            this.ui.hideContextualTabs();
        }
    }

    newNotebook() {
        this.notebook = {
            name: "New Notebook",
            sections: [
                {
                    name: "Section 1",
                    pages: [
                        { name: "Page 1", elements: [] }
                    ]
                }
            ]
        };
        
        this.currentSection = this.notebook.sections[0];
        this.currentPage = this.currentSection.pages[0];
        this.selectedElement = null;
        
        this.ui.renderNotebooksTree();
        this.renderPage();
        this.history.clear();
        
        this.ui.showToast('New notebook created');
    }

    addSection() {
        const newSection = {
            name: `Section ${this.notebook.sections.length + 1}`,
            pages: [
                { name: "Page 1", elements: [] }
            ]
        };
        
        this.notebook.sections.push(newSection);
        this.currentSection = newSection;
        this.currentPage = newSection.pages[0];
        this.selectedElement = null;
        
        this.ui.renderNotebooksTree();
        this.renderPage();
        this.history.clear();
        
        this.ui.showToast('New section added');
    }

    addPage(sectionIndex) {
        if (sectionIndex >= 0 && sectionIndex < this.notebook.sections.length) {
            const section = this.notebook.sections[sectionIndex];
            const newPage = {
                name: `Page ${section.pages.length + 1}`,
                elements: []
            };
            
            section.pages.push(newPage);
            this.currentSection = section;
            this.currentPage = newPage;
            this.selectedElement = null;
            
            this.ui.renderNotebooksTree();
            this.renderPage();
            this.history.clear();
            
            this.ui.showToast('New page added');
        }
    }

    renameItem(type, index, newName) {
        if (type === 'notebook' && index === 0) {
            this.notebook.name = newName;
        } else if (type === 'section' && index >= 0 && index < this.notebook.sections.length) {
            this.notebook.sections[index].name = newName;
        } else if (type === 'page') {
            const sectionIndex = this.ui.getCurrentSectionIndex();
            if (sectionIndex >= 0 && sectionIndex < this.notebook.sections.length) {
                const section = this.notebook.sections[sectionIndex];
                if (index >= 0 && index < section.pages.length) {
                    section.pages[index].name = newName;
                }
            }
        }
        
        this.ui.renderNotebooksTree();
        this.ui.showToast('Renamed successfully');
    }

    deleteItem(type, index) {
        if (type === 'section' && index >= 0 && index < this.notebook.sections.length) {
            this.notebook.sections.splice(index, 1);
            
            // If we deleted the current section, select the first one
            if (this.notebook.sections.length > 0) {
                this.currentSection = this.notebook.sections[0];
                this.currentPage = this.currentSection.pages[0];
            } else {
                // If no sections left, create a new one
                this.addSection();
                return;
            }
        } else if (type === 'page') {
            const sectionIndex = this.ui.getCurrentSectionIndex();
            if (sectionIndex >= 0 && sectionIndex < this.notebook.sections.length) {
                const section = this.notebook.sections[sectionIndex];
                if (index >= 0 && index < section.pages.length) {
                    section.pages.splice(index, 1);
                    
                    // If we deleted the current page, select the first one
                    if (section.pages.length > 0) {
                        this.currentPage = section.pages[0];
                    } else {
                        // If no pages left, create a new one
                        this.addPage(sectionIndex);
                        return;
                    }
                }
            }
        }
        
        this.selectedElement = null;
        this.ui.renderNotebooksTree();
        this.renderPage();
        this.history.clear();
        
        this.ui.showToast('Deleted successfully');
    }

    selectPage(sectionIndex, pageIndex) {
        if (sectionIndex >= 0 && sectionIndex < this.notebook.sections.length) {
            const section = this.notebook.sections[sectionIndex];
            if (pageIndex >= 0 && pageIndex < section.pages.length) {
                this.currentSection = section;
                this.currentPage = section.pages[pageIndex];
                this.selectedElement = null;
                
                this.ui.renderNotebooksTree();
                this.renderPage();
                this.history.clear();
            }
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OneNoteApp();
});