import type { CustomPlaceholder, DocumentType } from '../types';

const STORAGE_KEY = 'diu_aim_custom_placeholders';

type StoredPlaceholders = Record<string, CustomPlaceholder[]>;

const getAllStoredPlaceholders = (): StoredPlaceholders => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error("Failed to parse placeholders from localStorage:", error);
        return {};
    }
};

const saveAllStoredPlaceholders = (allPlaceholders: StoredPlaceholders) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allPlaceholders));
    } catch (error) {
        console.error("Failed to save placeholders to localStorage:", error);
    }
};

export const getCustomPlaceholders = (generatorType: DocumentType): CustomPlaceholder[] => {
    const allPlaceholders = getAllStoredPlaceholders();
    return allPlaceholders[generatorType] || [];
};

export const addCustomPlaceholder = (generatorType: DocumentType, placeholderData: { name: string, description: string }): CustomPlaceholder => {
    const allPlaceholders = getAllStoredPlaceholders();
    const newPlaceholder: CustomPlaceholder = { ...placeholderData, id: `custom-ph-${Date.now()}` };
    const currentPlaceholders = allPlaceholders[generatorType] || [];
    
    const newAllPlaceholders = {
        ...allPlaceholders,
        [generatorType]: [...currentPlaceholders, newPlaceholder],
    };
    
    saveAllStoredPlaceholders(newAllPlaceholders);
    return newPlaceholder;
};

export const updateCustomPlaceholder = (generatorType: DocumentType, placeholderId: string, updates: { name: string, description: string }): CustomPlaceholder | undefined => {
    const allPlaceholders = getAllStoredPlaceholders();
    const currentPlaceholders = allPlaceholders[generatorType] || [];
    const placeholderIndex = currentPlaceholders.findIndex(p => p.id === placeholderId);

    if (placeholderIndex !== -1) {
        const updatedPlaceholder = { ...currentPlaceholders[placeholderIndex], ...updates };
        const newPlaceholders = currentPlaceholders.map((p, index) => 
            index === placeholderIndex ? updatedPlaceholder : p
        );

        const newAllPlaceholders = {
            ...allPlaceholders,
            [generatorType]: newPlaceholders,
        };

        saveAllStoredPlaceholders(newAllPlaceholders);
        return updatedPlaceholder;
    }
    return undefined;
};

export const deleteCustomPlaceholder = (generatorType: DocumentType, placeholderId: string): void => {
    const allPlaceholders = getAllStoredPlaceholders();
    const currentPlaceholders = allPlaceholders[generatorType] || [];
    const newPlaceholders = currentPlaceholders.filter(p => p.id !== placeholderId);

    const newAllPlaceholders = {
        ...allPlaceholders,
        [generatorType]: newPlaceholders,
    };
    
    saveAllStoredPlaceholders(newAllPlaceholders);
};