class LanguageManager {
    constructor() {
        this.translations = {};
        this.currentLang = localStorage.getItem('preferred-language') || 'th';
        this.init();
    }

    async init() {
        try {
            // Load translations
            const response = await fetch('translations.json');
            this.translations = await response.json();
            
            // Setup language switcher
            this.setupLanguageSwitcher();
            
            // Initial translation
            this.translate();
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    setupLanguageSwitcher() {
        const header = document.querySelector('.header-content');
        const langSwitcher = document.createElement('div');
        langSwitcher.className = 'language-switcher';
        langSwitcher.innerHTML = `
            <button class="lang-btn ${this.currentLang === 'th' ? 'active' : ''}" data-lang="th">
                <img src="https://flagcdn.com/w20/th.png" alt="ไทย"> ไทย
            </button>
            <button class="lang-btn ${this.currentLang === 'en' ? 'active' : ''}" data-lang="en">
                <img src="https://flagcdn.com/w20/gb.png" alt="English"> English
            </button>
        `;

        // Add event listeners to language buttons
        langSwitcher.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.switchLanguage(lang);
                
                // Update active state
                langSwitcher.querySelectorAll('.lang-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.lang === lang);
                });
            });
        });

        // Insert language switcher
        header.appendChild(langSwitcher);
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('preferred-language', lang);
        this.translate();
    }

    translate() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.dataset.i18n;
            const translation = this.getTranslation(key);
            
            if (translation) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Update document title
        document.title = this.getTranslation('title');
    }

    getTranslation(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }
        
        return value;
    }

    // Helper method to get translation programmatically
    t(key) {
        return this.getTranslation(key);
    }
}

// Initialize language manager when document is ready
let languageManager;
document.addEventListener('DOMContentLoaded', () => {
    languageManager = new LanguageManager();
});
