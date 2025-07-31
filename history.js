export class HistoryManager {
    constructor(app) {
        this.app = app;
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 50;
    }

    saveState() {
        // Create a deep copy of the current page
        const state = JSON.parse(JSON.stringify(this.app.currentPage));
        
        // If we're not at the end of the history, remove all states after the current index
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        // Add the new state
        this.history.push(state);
        this.currentIndex++;
        
        // Limit the history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.currentIndex--;
        }
        
        // Update UI
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.restoreState(this.history[this.currentIndex]);
            this.app.ui.showToast('Undo successful');
        }
    }

    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            this.restoreState(this.history[this.currentIndex]);
            this.app.ui.showToast('Redo successful');
        }
    }

    restoreState(state) {
        // Restore the page state
        this.app.currentPage.elements = JSON.parse(JSON.stringify(state.elements));
        
        // Re-render the page
        this.app.renderPage();
        
        // Update UI
        this.updateUndoRedoButtons();
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        undoBtn.disabled = this.currentIndex <= 0;
        redoBtn.disabled = this.currentIndex >= this.history.length - 1;
        
        if (undoBtn.disabled) {
            undoBtn.style.opacity = '0.5';
        } else {
            undoBtn.style.opacity = '1';
        }
        
        if (redoBtn.disabled) {
            redoBtn.style.opacity = '0.5';
        } else {
            redoBtn.style.opacity = '1';
        }
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.saveState();
    }
}