export interface Settings {
    signature: string;
    defaultCc: string;
    defaultBcc: string;
}

const STORAGE_KEY = 'diu_aim_email_settings';
export const SETTINGS_UPDATED_EVENT = 'settingsUpdated';

export const getSettings = (): Settings => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const settings = stored ? JSON.parse(stored) : {};
        // Ensure all fields are present to prevent errors with older saved settings
        return {
            signature: settings.signature || '',
            defaultCc: settings.defaultCc || '',
            defaultBcc: settings.defaultBcc || '',
        };
    } catch (error) {
        console.error("Failed to parse settings from localStorage:", error);
        return { signature: '', defaultCc: '', defaultBcc: '' };
    }
};

export const saveSettings = (settings: Settings) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: settings }));
    } catch (error) {
        console.error("Failed to save settings to localStorage:", error);
    }
};