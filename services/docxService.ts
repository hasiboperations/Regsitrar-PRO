import type { DocumentContent } from "../types";
import saveAs from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType, Table, TableRow, TableCell, WidthType, VerticalAlign, IStylesOptions, BorderStyle } from 'docx';

type BodyPart = { type: 'paragraph'; content: string } | { type: 'table'; headers: string[]; rows: string[][] };

const memoSectionProps = {
    page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1.0 inch
    },
};

const createMultiLineRuns = (text: string, size: number = 24, bold: boolean = false): TextRun[] => {
    const lines = text.split('\n');
    const runs: TextRun[] = [];
    lines.forEach((line, i) => {
        runs.push(new TextRun({ text: line, size, bold, font: "Calibri" }));
        if (i < lines.length - 1) {
            runs.push(new TextRun({ break: 1 }));
        }
    });
    return runs;
};

export const parseBodyContent = (body: string | undefined): BodyPart[] => {
    const parts: BodyPart[] = [];
    const lines = (body || '').split('\n');
    let currentTableRows: string[][] = [];

    const finalizeTable = () => {
        if (currentTableRows.length === 0) return;
        const headers = currentTableRows.shift() || [];
        const numColumns = headers.length;
        const normalizedRows = currentTableRows.map(row => {
            const newRow = [...row];
            while (newRow.length < numColumns) newRow.push('');
            return newRow.slice(0, numColumns);
        });
        parts.push({ type: 'table', headers, rows: normalizedRows });
        currentTableRows = [];
    };

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('|')) {
            let lineContent = trimmedLine.slice(1).replace(/\|$/, '');
            const cells = lineContent.split('|').map(cell => cell.trim());
            if (cells.some(c => c !== '')) currentTableRows.push(cells);
        } else {
            finalizeTable();
            if (trimmedLine) parts.push({ type: 'paragraph', content: trimmedLine });
        }
    }
    finalizeTable();
    return parts;
};

const generateDocxBody = (body: string | undefined): (Paragraph | Table)[] => {
    const content: (Paragraph | Table)[] = [];
    const parts = parseBodyContent(body);

    for (const part of parts) {
        if (part.type === 'paragraph') {
            content.push(new Paragraph({
                children: [new TextRun({ text: part.content, font: "Calibri", size: 24 })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 240, after: 0, line: 360 } // 1.5 line spacing (360 twips)
            }));
        } else if (part.type === 'table') {
            const rows = [
                new TableRow({
                    children: part.headers.map(h => new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, font: "Calibri", size: 24 })], alignment: AlignmentType.CENTER })],
                        shading: { fill: "F3F4F6" }
                    }))
                }),
                ...part.rows.map(r => new TableRow({
                    children: r.map(c => new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: c, font: "Calibri", size: 24 })] })]
                    }))
                }))
            ];
            content.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
        }
    }
    return content;
};

const getMemoChildren = (docContent: DocumentContent): (Paragraph | Table)[] => {
    return [
        new Paragraph({
            children: [new TextRun({ text: "Daffodil International University (DIU)", bold: true, size: 40, font: "Calibri" })],
            alignment: AlignmentType.CENTER
        }),
        new Paragraph({
            children: [new TextRun({ text: "Daffodil Smart City (DSC), Birulia, Savar, Dhaka-1216, Bangladesh", size: 22, font: "Calibri" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 }
        }),
        new Paragraph({
            children: [new TextRun({ text: "Memorandum", bold: true, size: 32, font: "Calibri", underline: { type: UnderlineType.SINGLE } })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 240 }
        }),
        new Paragraph({ 
            children: [new TextRun({ text: `Ref : ${docContent.ref}`, size: 24, font: "Calibri" })], 
            spacing: { before: 120, line: 360 } 
        }),
        new Paragraph({ 
            children: [new TextRun({ text: `Date : ${docContent.doc_date}`, size: 24, font: "Calibri" })], 
            spacing: { line: 360 } 
        }),
        new Paragraph({ 
            children: [new TextRun({ text: `From : ${docContent.from || 'Registrar'}`, size: 24, font: "Calibri" })], 
            spacing: { line: 360 } 
        }),
        new Paragraph({ 
            children: createMultiLineRuns(`To : ${docContent.to}`, 24), 
            spacing: { after: 240, line: 360 } 
        }),
        new Paragraph({ 
            children: [new TextRun({ text: `Subject: ${docContent.subject}`, bold: true, size: 24, font: "Calibri" })],
            alignment: AlignmentType.CENTER, // Center aligned subject
            spacing: { before: 240, after: 240, line: 360 }
        }),
        new Paragraph({ 
            children: [new TextRun({ text: "Description:", bold: true, size: 24, font: "Calibri" })], 
            spacing: { line: 360 } 
        }),
        ...generateDocxBody(docContent.body),
        
        new Paragraph({
            children: [new TextRun({ text: "Cc:", bold: true, size: 24, font: "Calibri" })],
            spacing: { before: 480, line: 360 }
        }),
        ...(docContent.cc || []).map(item => new Paragraph({
            children: [new TextRun({ text: item, size: 24, font: "Calibri" })],
            spacing: { line: 240 }
        }))
    ];
};

const memorandumStyles: IStylesOptions = {
    paragraphStyles: [{
        id: "normal", 
        name: "Normal", 
        run: { font: "Calibri", size: 24 },
        paragraph: { spacing: { line: 360 } } // 1.5 spacing
    }]
};

export const getDocumentBlob = async (docContent: DocumentContent): Promise<Blob> => {
    const doc = new Document({
        styles: memorandumStyles,
        sections: [{
            properties: memoSectionProps,
            children: getMemoChildren(docContent)
        }]
    });
    return await Packer.toBlob(doc);
};

export const generateSingleDocx = async (docContent: DocumentContent) => {
    const blob = await getDocumentBlob(docContent);
    const safeSubject = docContent.subject.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 100);
    saveAs(blob, `${safeSubject || 'Memorandum'}.docx`);
};

export const generateAllDocx = async (docs: DocumentContent[]) => {
    const doc = new Document({
        styles: memorandumStyles,
        sections: docs.map(d => ({
            properties: memoSectionProps,
            children: getMemoChildren(d) as any
        }))
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Combined_Memorandums.docx");
};

export const generateExtractedTextDocx = async (text: string) => {
    const doc = new Document({
        styles: memorandumStyles,
        sections: [{ 
            properties: memoSectionProps,
            children: [new Paragraph({ children: [new TextRun({ text, size: 24 })] })] 
        }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Extracted_Text.docx");
};

export interface AgendaData {
    meetingTitle: string;
    meetingNumber: string;
    date: string;
    time: string;
    venue: string;
    items: { sl: string; agenda: string }[];
}

const createAgendaDocument = (data: AgendaData): Document => {
    return new Document({
        sections: [{
            properties: memoSectionProps,
            children: [
                new Paragraph({
                    children: [new TextRun({ text: "Daffodil International University (DIU)", bold: true, size: 44, font: "Times New Roman" })],
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                    children: [new TextRun({ text: "Daffodil Smart City (DSC), Birulia, Savar, Dhaka-1216, Bangladesh", size: 24, font: "Times New Roman" })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 240 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: "Meeting Agenda", bold: true, size: 28, font: "Times New Roman", underline: { type: UnderlineType.SINGLE } })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 240, after: 240 }
                }),
                new Paragraph({ children: [new TextRun({ text: `Meeting Name: ${data.meetingTitle}`, font: "Times New Roman", size: 24 })], spacing: { line: 276 } }),
                new Paragraph({ children: [new TextRun({ text: `Meeting Number: ${data.meetingNumber}`, font: "Times New Roman", size: 24 })], spacing: { line: 276 } }),
                new Paragraph({ children: [new TextRun({ text: `Date: ${data.date}`, font: "Times New Roman", size: 24 })], spacing: { line: 276 } }),
                new Paragraph({ children: [new TextRun({ text: `Time: ${data.time}`, font: "Times New Roman", size: 24 })], spacing: { line: 276 } }),
                new Paragraph({ children: [new TextRun({ text: `Venue: ${data.venue}`, font: "Times New Roman", size: 24 })], spacing: { after: 240, line: 276 } }),
                new Paragraph({
                    children: [new TextRun({ text: `Agenda of the ${data.meetingNumber} ${data.meetingTitle}:`, bold: true, font: "Times New Roman", size: 24 })],
                    spacing: { before: 240, after: 120 }
                }),
                ...data.items.map(item => new Paragraph({
                    children: [
                        new TextRun({ text: `${item.sl}. `, font: "Times New Roman", size: 24 }),
                        new TextRun({ text: item.agenda, font: "Times New Roman", size: 24 }),
                    ],
                    spacing: { after: 120, line: 276 },
                    alignment: AlignmentType.JUSTIFIED,
                }))
            ]
        }]
    });
};

export const getAgendaBlob = async (data: AgendaData): Promise<Blob> => {
    const doc = createAgendaDocument(data);
    return await Packer.toBlob(doc);
};

export const generateAgendaDocx = async (data: AgendaData) => {
    const blob = await getAgendaBlob(data);
    saveAs(blob, `Agenda_${data.meetingNumber}_${data.meetingTitle.substring(0, 50)}.docx`);
};

export interface ProceedingsData {
    universityName: string;
    meetingName: string;
    meetingNumber: string;
    date: string;
    time: string;
    venue: string;
    chairpersonName: string;
    chairpersonTitle: string;
    registrarName: string;
    registrarTitle: string;
    items: {
        sl: string;
        agenda: string;
        discussion: string;
        decision: string;
        responsibility: string;
    }[];
}

const createProceedingsDocument = (data: ProceedingsData): Document => {
    const children: (Paragraph | Table)[] = [
        new Paragraph({
            children: [new TextRun({ text: data.universityName, bold: true, size: 44, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER
        }),
        new Paragraph({
            children: [new TextRun({ text: "Daffodil Smart City (DSC), Birulia, Savar, Dhaka-1216, Bangladesh", size: 24, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 }
        }),
        new Paragraph({
            children: [new TextRun({ text: `Proceedings of the ${data.meetingNumber} meeting of the ${data.meetingName}`, bold: true, size: 28, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 240 }
        }),
        new Paragraph({ children: [new TextRun({ text: `Date: ${data.date}`, font: "Times New Roman", size: 24 })], spacing: { line: 276 } }),
        new Paragraph({ children: [new TextRun({ text: `Time: ${data.time}`, font: "Times New Roman", size: 24 })], spacing: { line: 276 } }),
        new Paragraph({ children: [new TextRun({ text: `Venue: ${data.venue}`, font: "Times New Roman", size: 24 })], spacing: { after: 240, line: 276 } }),
    ];

    data.items.forEach(item => {
        children.push(new Paragraph({
            children: [new TextRun({ text: `Agenda ${item.sl}: ${item.agenda}`, bold: true, font: "Times New Roman", size: 24 })],
            spacing: { before: 240, after: 120 }
        }));
        if (item.discussion) {
            children.push(new Paragraph({ children: [new TextRun({ text: "Discussion:", bold: true, font: "Times New Roman", size: 24 })], spacing: { before: 120 } }));
            children.push(new Paragraph({ children: [new TextRun({ text: item.discussion, font: "Times New Roman", size: 24 })], spacing: { after: 120, line: 276 }, alignment: AlignmentType.JUSTIFIED }));
        }
        if (item.decision) {
            children.push(new Paragraph({ children: [new TextRun({ text: "Decision:", bold: true, font: "Times New Roman", size: 24 })], spacing: { before: 120 } }));
            children.push(new Paragraph({ children: [new TextRun({ text: item.decision, font: "Times New Roman", size: 24 })], spacing: { after: 120, line: 276 }, alignment: AlignmentType.JUSTIFIED }));
        }
        if (item.responsibility) {
            children.push(new Paragraph({ children: [new TextRun({ text: `Responsibility: ${item.responsibility}`, font: "Times New Roman", size: 24, italics: true })], spacing: { after: 240 } }));
        }
    });

    children.push(new Paragraph({ children: [new TextRun({ text: "\n\n", size: 24 })], spacing: { before: 1000 } }));

    const footerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "__________________________", size: 24 })], alignment: AlignmentType.CENTER }),
                            new Paragraph({ children: [new TextRun({ text: data.registrarName, bold: true, size: 24 })], alignment: AlignmentType.CENTER }),
                            new Paragraph({ children: [new TextRun({ text: data.registrarTitle, size: 24 })], alignment: AlignmentType.CENTER }),
                        ],
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({ children: [new TextRun({ text: "__________________________", size: 24 })], alignment: AlignmentType.CENTER }),
                            new Paragraph({ children: [new TextRun({ text: data.chairpersonName, bold: true, size: 24 })], alignment: AlignmentType.CENTER }),
                            new Paragraph({ children: [new TextRun({ text: data.chairpersonTitle, size: 24 })], alignment: AlignmentType.CENTER }),
                        ],
                    }),
                ],
            }),
        ],
    });

    children.push(footerTable);

    return new Document({
        sections: [{
            properties: memoSectionProps,
            children: children as any
        }]
    });
};

export const getProceedingsBlob = async (data: ProceedingsData): Promise<Blob> => {
    const doc = createProceedingsDocument(data);
    return await Packer.toBlob(doc);
};

export const generateProceedingsDocx = async (data: ProceedingsData) => {
    const blob = await getProceedingsBlob(data);
    saveAs(blob, `Proceedings_${data.meetingNumber}_${data.meetingName.substring(0, 50)}.docx`);
};

export interface GeneralNoticeData {
    date: string;
    description: string;
}

const createGeneralNoticeDocument = (data: GeneralNoticeData): Document => {
    return new Document({
        sections: [{
            properties: memoSectionProps,
            children: [
                new Paragraph({
                    children: [new TextRun({ text: "Daffodil International University (DIU)", bold: true, size: 40, font: "Times New Roman" })],
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                    children: [new TextRun({ text: "Daffodil Smart City (DSC), Birulia, Savar, Dhaka-1216, Bangladesh", size: 24, font: "Times New Roman" })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 480 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: `Date: ${data.date}`, font: "Times New Roman", size: 32 })],
                    alignment: AlignmentType.RIGHT,
                    spacing: { after: 480 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: "Notice", bold: true, size: 68, font: "Times New Roman", underline: { type: UnderlineType.SINGLE } })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 480, after: 480 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: data.description, font: "Times New Roman", size: 36 })],
                    spacing: { before: 480, after: 480, line: 400 },
                    alignment: AlignmentType.JUSTIFIED,
                }),
                new Paragraph({ children: [new TextRun({ text: "\n\n", size: 24 })], spacing: { before: 1000 } }),
                new Paragraph({ children: [new TextRun({ text: "……………………………………………………", size: 28 })], alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: "Dr. Mohammed Nadir Bin Ali", bold: true, size: 28 })], alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: "Registrar", size: 28 })], alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: "Daffodil International University", size: 28 })], alignment: AlignmentType.CENTER }),
            ]
        }]
    });
};

export const generateGeneralNoticeDocx = async (data: GeneralNoticeData) => {
    const doc = createGeneralNoticeDocument(data);
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Notice_${data.date.replace(/,?\s+/g, '_')}.docx`);
};