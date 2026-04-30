import type { Template, DocumentType } from '../types';

// Internal types for storing templates with version history
interface TemplateVersion {
    content: string;
    savedAt: string; // ISO date string
}

export interface StoredCustomTemplate {
    id: string;
    name: string;
    content: string; // Always the latest content
    createdAt: string;
    updatedAt: string;
    history: TemplateVersion[];
}

const STORAGE_KEY = 'diu_aim_custom_templates';

type StoredTemplates = Record<string, StoredCustomTemplate[]>;

// --- Data Migration & Access ---

const migrateTemplate = (template: any): StoredCustomTemplate => {
    if (template.history && Array.isArray(template.history)) {
        return template as StoredCustomTemplate;
    }
    const now = new Date().toISOString();
    return {
        id: template.id,
        name: template.name,
        content: template.content,
        createdAt: now,
        updatedAt: now,
        history: [{ content: template.content, savedAt: now }],
    };
};

const getAllStoredTemplates = (): StoredTemplates => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return {};
        
        const allTemplates = JSON.parse(stored);
        // Perform migration for old data structure if needed
        Object.keys(allTemplates).forEach(key => {
            if (Array.isArray(allTemplates[key])) {
                allTemplates[key] = allTemplates[key].map(migrateTemplate);
            }
        });
        return allTemplates;
    } catch (error) {
        console.error("Failed to parse templates from localStorage:", error);
        return {};
    }
};

const saveAllStoredTemplates = (allTemplates: StoredTemplates) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allTemplates));
    } catch (error) {
        console.error("Failed to save templates to localStorage:", error);
    }
};

// --- Public API ---

export const getCustomTemplates = (generatorType: DocumentType): Template[] => {
    const allTemplates = getAllStoredTemplates();
    const stored = allTemplates[generatorType] || [];
    return stored.map(t => ({
        id: t.id,
        name: t.name,
        content: t.content,
        isDefault: false
    }));
};

export const getTemplateWithHistory = (generatorType: DocumentType, templateId: string): StoredCustomTemplate | undefined => {
    const allTemplates = getAllStoredTemplates();
    const currentTemplates = allTemplates[generatorType] || [];
    return currentTemplates.find(t => t.id === templateId);
};

export const addCustomTemplate = (generatorType: DocumentType, templateData: { name: string, content: string }): Template => {
    const allTemplates = getAllStoredTemplates();
    const now = new Date().toISOString();
    
    const newTemplate: StoredCustomTemplate = {
        ...templateData,
        id: `custom-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        history: [{ content: templateData.content, savedAt: now }],
    };
    
    const currentTemplates = allTemplates[generatorType] || [];
    const newAllTemplates = {
        ...allTemplates,
        [generatorType]: [...currentTemplates, newTemplate],
    };

    saveAllStoredTemplates(newAllTemplates);
    return { id: newTemplate.id, name: newTemplate.name, content: newTemplate.content, isDefault: false };
};

export const updateCustomTemplate = (generatorType: DocumentType, templateId: string, updates: { name: string, content: string }): Template | undefined => {
    const allTemplates = getAllStoredTemplates();
    const currentTemplates = allTemplates[generatorType] || [];
    const templateIndex = currentTemplates.findIndex(t => t.id === templateId);

    if (templateIndex !== -1) {
        const originalTemplate = currentTemplates[templateIndex];
        const now = new Date().toISOString();

        const newHistory = [...originalTemplate.history];
        // If content has changed, add the old version to history
        if (originalTemplate.content !== updates.content) {
            newHistory.push({
                content: originalTemplate.content,
                savedAt: originalTemplate.updatedAt,
            });
        }

        const updatedTemplate: StoredCustomTemplate = {
            ...originalTemplate,
            name: updates.name,
            content: updates.content,
            updatedAt: now,
            history: newHistory,
        };
        
        const newTemplates = currentTemplates.map((template, index) => 
            index === templateIndex ? updatedTemplate : template
        );

        const newAllTemplates = {
            ...allTemplates,
            [generatorType]: newTemplates,
        };

        saveAllStoredTemplates(newAllTemplates);
        return { id: updatedTemplate.id, name: updatedTemplate.name, content: updatedTemplate.content, isDefault: false };
    }
    return undefined;
};

export const restoreTemplateVersion = (generatorType: DocumentType, templateId: string, version: TemplateVersion): Template | undefined => {
    const allTemplates = getAllStoredTemplates();
    const currentTemplates = allTemplates[generatorType] || [];
    const template = currentTemplates.find(t => t.id === templateId);
    if (!template) return undefined;
    
    // Use updateCustomTemplate to restore, which automatically handles history
    return updateCustomTemplate(generatorType, templateId, { name: template.name, content: version.content });
}

export const deleteCustomTemplate = (generatorType: DocumentType, templateId: string): void => {
    const allTemplates = getAllStoredTemplates();
    const currentTemplates = allTemplates[generatorType] || [];
    const newTemplates = currentTemplates.filter(t => t.id !== templateId);
    
    const newAllTemplates = {
        ...allTemplates,
        [generatorType]: newTemplates,
    };
    
    saveAllStoredTemplates(newAllTemplates);
};
