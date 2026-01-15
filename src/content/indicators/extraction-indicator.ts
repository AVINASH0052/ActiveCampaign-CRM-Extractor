/**
 * Extraction indicator component using Shadow DOM for style isolation
 * Displays visual feedback during data extraction
 */

type IndicatorState = 'idle' | 'extracting' | 'success' | 'error';

interface IndicatorMessage {
    state: IndicatorState;
    primaryText: string;
    secondaryText?: string;
    recordCount?: number;
}

class ExtractionStatusIndicator {
    private hostElement: HTMLDivElement | null = null;
    private shadowRoot: ShadowRoot | null = null;
    private autoHideTimer: number | null = null;
    private readonly hostId = 'crm-extraction-status-indicator';

    initialize(): void {
        if (document.getElementById(this.hostId)) {
            return;
        }

        this.hostElement = document.createElement('div');
        this.hostElement.id = this.hostId;
        this.shadowRoot = this.hostElement.attachShadow({ mode: 'closed' });

        this.injectStyles();
        this.createIndicatorStructure();

        document.body.appendChild(this.hostElement);
    }

    private injectStyles(): void {
        if (!this.shadowRoot) return;

        const styleElement = document.createElement('style');
        styleElement.textContent = `
      :host {
        all: initial;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .indicator-wrapper {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        pointer-events: none;
      }

      .indicator-card {
        display: none;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 
                    0 8px 10px -6px rgba(0, 0, 0, 0.1);
        min-width: 220px;
        max-width: 320px;
        pointer-events: auto;
        animation: slideIn 0.25s ease-out;
      }

      .indicator-card.visible {
        display: flex;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .status-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .status-icon.extracting {
        background: #eff6ff;
      }

      .status-icon.success {
        background: #dcfce7;
      }

      .status-icon.error {
        background: #fee2e2;
      }

      .spinner-ring {
        width: 20px;
        height: 20px;
        border: 2.5px solid #bfdbfe;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .icon-svg {
        width: 20px;
        height: 20px;
      }

      .icon-svg.success-icon {
        color: #16a34a;
      }

      .icon-svg.error-icon {
        color: #dc2626;
      }

      .text-container {
        flex: 1;
        min-width: 0;
      }

      .primary-text {
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
        margin: 0 0 2px 0;
        line-height: 1.4;
      }

      .secondary-text {
        font-size: 12px;
        color: #64748b;
        margin: 0;
        line-height: 1.3;
      }

      .record-count {
        font-weight: 600;
        color: #2563eb;
      }
    `;

        this.shadowRoot.appendChild(styleElement);
    }

    private createIndicatorStructure(): void {
        if (!this.shadowRoot) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'indicator-wrapper';
        wrapper.innerHTML = `
      <div class="indicator-card" id="indicator-card">
        <div class="status-icon" id="status-icon">
          <div class="spinner-ring" id="spinner"></div>
          <svg class="icon-svg success-icon" id="success-icon" style="display:none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <svg class="icon-svg error-icon" id="error-icon" style="display:none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <div class="text-container">
          <p class="primary-text" id="primary-text">Extracting data...</p>
          <p class="secondary-text" id="secondary-text"></p>
        </div>
      </div>
    `;

        this.shadowRoot.appendChild(wrapper);
    }

    displayStatus(message: IndicatorMessage): void {
        if (!this.shadowRoot) {
            this.initialize();
        }

        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }

        const card = this.shadowRoot?.getElementById('indicator-card');
        const statusIcon = this.shadowRoot?.getElementById('status-icon');
        const spinner = this.shadowRoot?.getElementById('spinner');
        const successIcon = this.shadowRoot?.getElementById('success-icon');
        const errorIcon = this.shadowRoot?.getElementById('error-icon');
        const primaryText = this.shadowRoot?.getElementById('primary-text');
        const secondaryText = this.shadowRoot?.getElementById('secondary-text');

        if (!card || !statusIcon || !spinner || !successIcon || !errorIcon || !primaryText || !secondaryText) {
            return;
        }

        if (message.state === 'idle') {
            card.classList.remove('visible');
            return;
        }

        card.classList.add('visible');
        statusIcon.className = `status-icon ${message.state}`;

        spinner.style.display = message.state === 'extracting' ? 'block' : 'none';
        successIcon.style.display = message.state === 'success' ? 'block' : 'none';
        errorIcon.style.display = message.state === 'error' ? 'block' : 'none';

        primaryText.textContent = message.primaryText;

        if (message.secondaryText) {
            secondaryText.style.display = 'block';
            if (message.recordCount !== undefined && message.recordCount > 0) {
                secondaryText.innerHTML = `Found <span class="record-count">${message.recordCount}</span> records`;
            } else {
                secondaryText.textContent = message.secondaryText;
            }
        } else {
            secondaryText.style.display = 'none';
        }

        if (message.state === 'success' || message.state === 'error') {
            this.autoHideTimer = window.setTimeout(() => {
                this.hide();
            }, 3500);
        }
    }

    showExtracting(entityType: string): void {
        this.displayStatus({
            state: 'extracting',
            primaryText: `Extracting ${entityType}...`,
            secondaryText: 'Scanning page content',
        });
    }

    showSuccess(entityType: string, recordCount: number): void {
        this.displayStatus({
            state: 'success',
            primaryText: `${entityType} extracted`,
            secondaryText: 'Records found',
            recordCount,
        });
    }

    showError(errorMessage: string): void {
        this.displayStatus({
            state: 'error',
            primaryText: 'Extraction failed',
            secondaryText: errorMessage,
        });
    }

    hide(): void {
        this.displayStatus({
            state: 'idle',
            primaryText: '',
        });
    }

    destroy(): void {
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
        }

        if (this.hostElement && this.hostElement.parentNode) {
            this.hostElement.parentNode.removeChild(this.hostElement);
        }

        this.hostElement = null;
        this.shadowRoot = null;
    }
}

export const extractionIndicator = new ExtractionStatusIndicator();
