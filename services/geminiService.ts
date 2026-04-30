import { GoogleGenAI, Type } from "@google/genai";
import mammoth from 'mammoth';
import type { DocumentContent, DocumentType } from "../types";

export interface GlobalSettings {
    meetingName: string;
    meetingNumber: string;
    memoBookNumber: string;
    date: string;
    starterLine: string;
}

export interface GrammarSegment {
    text: string;
    isError: boolean;
    suggestion?: string;
    type?: string;
    explanation?: string;
}

export const getGenAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const diuCleanText = (text: string | undefined, isKeystroke: boolean = false): string => {
    if (!text) return "";
    let cleaned = text.replace(/[ ]{2,}/g, ' '); 
    return isKeystroke ? cleaned : cleaned.trim();
};

export const generateDetailedDescription = async (data: { presenterName: string, subject: string, meetingType: string, context?: string }): Promise<string> => {
    const ai = getGenAI();
    const isAcademic = data.meetingType.toLowerCase().includes('academic council');
    const isSyndicate = data.meetingType.toLowerCase().includes('syndicate');
    const targetBody = isAcademic ? 'Academic Council' : 'Syndicate';

    const prompt = `You are a registrar's scribe at Daffodil International University. 
Generate a formal meeting background paragraph:
"{Presenter Name}, {Presenter Designation}, presented the {subject}. This agenda was submitted for the formal consideration and approval of the ${targetBody}."

STRICT RULES:
1. HONORIFICS: Always use Dr. or Eng. before names if applicable.
2. FORMALITY: Registrar-office standard.
3. SINGLE SPACING: No double spaces.
4. INPUT: ${data.presenterName} is presenting ${data.subject}. 

Output ONLY the paragraph.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
    });

    return diuCleanText(response.text);
};

export const generateMeetingDecision = async (data: { 
    meetingType: string, 
    subject: string, 
    decisionType: 'Approved' | 'Recommended' | 'Forwarded' | 'Rejected', 
    agendaNo: string 
}): Promise<string> => {
    const isAcademic = data.meetingType.toLowerCase().includes('academic council');
    const isSyndicate = data.meetingType.toLowerCase().includes('syndicate');
    
    let decision = "";
    const subject = data.subject.trim();

    if (isAcademic) {
        switch (data.decisionType) {
            case 'Recommended': decision = `The Academic Council unanimously recommended the ${subject} for approval of the Syndicate.`; break;
            case 'Approved': decision = `The Academic Council unanimously approved the ${subject}.`; break;
            case 'Rejected': decision = `The Academic Council unanimously did not approve the ${subject}.`; break;
            case 'Forwarded': decision = `The Academic Council unanimously forwarded the ${subject} to the Board of Trustees for approval.`; break;
        }
    } else if (isSyndicate) {
        switch (data.decisionType) {
            case 'Recommended': decision = `The Syndicate unanimously recommended the ${subject}.`; break;
            case 'Approved': decision = `The Syndicate unanimously approved the ${subject}.`; break;
            case 'Rejected': decision = `The Syndicate unanimously did not approve the ${subject}.`; break;
            case 'Forwarded': decision = `The Syndicate unanimously forwarded the ${subject} to the Board of Trustees for approval.`; break;
        }
    } else {
        decision = `The committee unanimously ${data.decisionType.toLowerCase()} the ${subject}.`;
    }

    return diuCleanText(decision);
};

export const enhanceMemoDescription = async (rawText: string): Promise<string> => {
    if (!rawText || !rawText.trim()) return "";
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Polish this institutional text for formal clarity. Single spacing only. Output ONLY text.\n\nText:\n${rawText}`,
    });
    return diuCleanText(response.text);
};

export const enhanceSubject = async (rawText: string): Promise<string> => {
    if (!rawText || !rawText.trim()) return "";
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Refine this formal document subject starting with "Decision on...". Clean spacing.\n\nSubject: ${rawText}`
    });
    return diuCleanText(response.text);
};

export const checkGrammar = async (rawText: string): Promise<GrammarSegment[]> => {
    if (!rawText || !rawText.trim()) return [];
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Check this document for grammar. Single spacing.\n\nText: ${rawText}`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    segments: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                isError: { type: Type.BOOLEAN },
                                suggestion: { type: Type.STRING },
                                type: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            },
                            required: ['text', 'isError']
                        }
                    }
                },
                required: ['segments']
            }
        }
    });
    try {
        const result = JSON.parse(response.text || '{"segments": []}');
        return result.segments || [];
    } catch (e) { return []; }
};

export const generateDocument = async (text: string, type: DocumentType, templateId: string, callbacks: any, settings: GlobalSettings) => {
    const ai = getGenAI();
    const currentYear = new Date().getFullYear();
    
    const abbreviations: Record<string, string> = {
        'Academic Council': 'AC',
        'Syndicate': 'Syn',
        'Management Committee': 'MC',
        "Dean's Committee": 'DC',
        'Joint Committee': 'Joint',
        'Special Committee': 'SC'
    };
    const abbrev = abbreviations[settings.meetingName] || 'MC';

    const prompt = `You are a professional scribe for the Office of the Registrar at Daffodil International University.
Generate formal official memorandums strictly following these rules:

INPUT:
- Meeting Name: ${settings.meetingName}
- Meeting Number: ${settings.meetingNumber}
- Date: ${settings.date}
- Book No: ${settings.memoBookNumber || '02'}
- Source: ${text}

STRICT FORMATTING:
1. Reference No: MUST follow exactly DIU/Reg./${abbrev}-${settings.meetingNumber}/Ag-[Agenda-No]/Memo/${settings.memoBookNumber || '02'}/${currentYear}/
2. Subject: MUST start with "Decision on ..." and be professionally descriptive.
3. Body Opening: "As per the decision of the ${settings.meetingNumber} meeting of the ${settings.meetingName} (held on ${settings.date}), I am directed to inform you that ..."
4. Recipients: List specific names based on the decision context.
5. Cleanliness: Single spacing only between words. No double spaces.

OUTPUT JSON:
{
"referenceNo": "string",
"date": "${settings.date}",
"recipient": "string",
"subject": "string",
"body": "string"
}`;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    try {
        const docs = JSON.parse(response.text || '[]');
        const items = Array.isArray(docs) ? docs : [docs];
        
        items.forEach((doc: any) => {
            callbacks.onData({
                doc_id: `M-${Math.random().toString(36).substring(7)}`,
                doc_type: 'memo',
                ref: doc.referenceNo,
                doc_date: doc.date,
                to: doc.recipient,
                from: 'Registrar',
                subject: doc.subject,
                body: diuCleanText(doc.body),
                cc: [
                    "Honorable Vice Chancellor",
                    "Honorable Pro-Vice Chancellor",
                    "Honorable Treasurer",
                    "Dr. Mohamed Emran Hossain, Honorable Member of BoT",
                    "Ms. Samiha Khan, Honorable Member of BoT",
                    "Honorable Dean, Academic Affairs",
                    "Office of the Honorable Chairman",
                    "Office Copy"
                ] 
            });
        });
        callbacks.onComplete();
    } catch (e) {
        callbacks.onError(e);
    }
};

export const extractTextFromFile = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

export const generateDocumentFromFile = async (file: File, type: DocumentType, templateId: string, callbacks: any, settings: GlobalSettings) => {
    const text = await extractTextFromFile(file);
    return generateDocument(text, type, templateId, callbacks, settings);
};

export const enhanceAgendaItem = async (text: string): Promise<string> => {
    if (!text || !text.trim()) return "";
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Polish this meeting agenda item for professional clarity at Daffodil International University. Output ONLY text.\n\nText: ${text}`,
    });
    return diuCleanText(response.text);
};

export const enhanceEmailSubject = async (text: string): Promise<string> => {
    if (!text || !text.trim()) return "";
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Refine this email subject line for an institutional administrative communication. Output ONLY text.\n\nSubject: ${text}`,
    });
    return diuCleanText(response.text);
};

export const enhanceEmailBody = async (text: string): Promise<string> => {
    if (!text || !text.trim()) return "";
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Polish this email body for formal institutional communication from the Registrar's Office. Maintain professional etiquette. Output ONLY text.\n\nText: ${text}`,
    });
    return diuCleanText(response.text);
};

export const enhanceNoticeText = async (text: string): Promise<string> => {
    if (!text || !text.trim()) return "";
    const ai = getGenAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Polish this text for a formal university notice. Use Markdown bolding (**) for key highlights if appropriate. Output ONLY text.\n\nText: ${text}`,
    });
    return diuCleanText(response.text);
};