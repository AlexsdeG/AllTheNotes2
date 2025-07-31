export class FileSystem {
    constructor(app) {
        this.app = app;
        this.fileInput = document.getElementById('file-input');
    }

    saveNotebook() {
        // Create a deep copy of the notebook
        const notebookData = JSON.parse(JSON.stringify(this.app.notebook));
        
        // Convert to JSON string
        const jsonStr = JSON.stringify(notebookData, null, 2);
        
        // Create a blob
        const blob = new Blob([jsonStr], { type: 'application/json' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${notebookData.name.replace(/\s+/g, '_')}.json`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        this.app.ui.showToast('Notebook saved successfully');
    }

    loadNotebook() {
        // Create a file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        // Parse the JSON
                        const notebookData = JSON.parse(event.target.result);
                        
                        // Validate the notebook structure
                        if (!this.validateNotebook(notebookData)) {
                            throw new Error('Invalid notebook file format');
                        }
                        
                        // Load the notebook
                        this.app.notebook = notebookData;
                        this.app.currentSection = this.app.notebook.sections[0];
                        this.app.currentPage = this.app.currentSection.pages[0];
                        this.app.selectedElement = null;
                        
                        // Update UI
                        this.app.ui.renderNotebooksTree();
                        this.app.renderPage();
                        this.app.history.clear();
                        
                        this.app.ui.showToast('Notebook loaded successfully');
                    } catch (error) {
                        this.app.ui.showToast(`Error loading notebook: ${error.message}`);
                    }
                };
                
                reader.readAsText(file);
            }
        };
        
        // Trigger file selection
        input.click();
    }

    validateNotebook(notebook) {
        // Basic validation
        if (!notebook.name || typeof notebook.name !== 'string') {
            return false;
        }
        
        if (!Array.isArray(notebook.sections) || notebook.sections.length === 0) {
            return false;
        }
        
        for (const section of notebook.sections) {
            if (!section.name || typeof section.name !== 'string') {
                return false;
            }
            
            if (!Array.isArray(section.pages) || section.pages.length === 0) {
                return false;
            }
            
            for (const page of section.pages) {
                if (!page.name || typeof page.name !== 'string') {
                    return false;
                }
                
                if (!Array.isArray(page.elements)) {
                    return false;
                }
            }
        }
        
        return true;
    }
}