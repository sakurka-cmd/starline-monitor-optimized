const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak, TableOfContents } = require('docx');
const fs = require('fs');

// Цветовая палитра "Midnight Code"
const colors = {
  primary: "#020617",      // Midnight Black
  body: "#1E293B",         // Deep Slate Blue
  secondary: "#64748B",    // Cool Blue-Gray
  accent: "#94A3B8",       // Steady Silver
  tableBg: "#F8FAFC",      // Glacial Blue-White
  border: "#CBD5E1"
};

const tableBorder = { style: BorderStyle.SINGLE, size: 8, color: colors.border };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: colors.primary, font: "Times New Roman" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: colors.body, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: colors.secondary, font: "Times New Roman" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-main", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-backend", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-worker", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-frontend", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullet-compose", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-backend", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-worker", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-frontend", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbered-compose", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ 
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "StarLine Monitor - \u041E\u0442\u0447\u0451\u0442 \u043E\u0431 \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u0438", color: colors.secondary, size: 20 })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ 
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "\u2014 ", color: colors.secondary }), new TextRun({ children: [PageNumber.CURRENT], color: colors.secondary }), new TextRun({ text: " \u2014", color: colors.secondary })]
      })] })
    },
    children: [
      // Титульная страница
      new Paragraph({ spacing: { before: 2400 } }),
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("\u041E\u041F\u0422\u0418\u041C\u0418\u0417\u0410\u0426\u0418\u042F STARLINE MONITOR")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u044B\u0439 \u0430\u043D\u0430\u043B\u0438\u0437 \u043A\u043E\u0434\u0430 \u0438 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u0430", size: 28, color: colors.secondary })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [new TextRun({ text: "31 \u043C\u0430\u0440\u0442\u0430 2026", size: 22, color: colors.accent })] }),
      new Paragraph({ children: [new PageBreak()] }),
      
      // Оглавление
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("\u0421\u043E\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u0435")] }),
      new TableOfContents("\u0421\u043E\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u0435", { hyperlink: true, headingStyleRange: "1-3" }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u0435: \u0434\u043B\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u0443\u043C\u0435\u0440\u0430\u0446\u0438\u0438 \u0441\u0442\u0440\u0430\u043D\u0438\u0446 \u0449\u0451\u043B\u043A\u043D\u0438\u0442\u0435 \u043F\u0440\u0430\u0432\u043E\u0439 \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \u043C\u044B\u0448\u0438 \u043F\u043E \u043E\u0433\u043B\u0430\u0432\u043B\u0435\u043D\u0438\u044E \u0438 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u00AB\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u043E\u043B\u0435\u00BB.", size: 18, color: "999999" })] }),
      new Paragraph({ children: [new PageBreak()] }),
      
      // 1. Обзор проекта
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. \u041E\u0431\u0437\u043E\u0440 \u043F\u0440\u043E\u0435\u043A\u0442\u0430")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "StarLine Monitor \u2014 \u044D\u0442\u043E \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430 \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u044C\u043D\u044B\u0445 \u0441\u0438\u0433\u043D\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0439 StarLine, \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u0430\u044F \u043D\u0430 \u043C\u0438\u043A\u0440\u043E\u0441\u0435\u0440\u0432\u0438\u0441\u043D\u043E\u0439 \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0435 \u0441 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435\u043C Docker. \u041F\u0440\u043E\u0435\u043A\u0442 \u0441\u043E\u0441\u0442\u043E\u0438\u0442 \u0438\u0437 \u0447\u0435\u0442\u044B\u0440\u0451\u0445 \u043E\u0441\u043D\u043E\u0432\u043D\u044B\u0445 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432: \u0431\u0430\u0437\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 MySQL 8.0, \u0431\u044D\u043A\u0435\u043D\u0434 \u043D\u0430 FastAPI (Python), \u0440\u0430\u0431\u043E\u0447\u0438\u0439 \u043F\u0440\u043E\u0446\u0435\u0441\u0441 \u0434\u043B\u044F \u0441\u0431\u043E\u0440\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u043E StarLine API \u0438 \u0444\u0440\u043E\u043D\u0442\u0435\u043D\u0434 \u043D\u0430 Next.js 16.", size: 24, color: colors.body })] }),
      
      // Таблица компонентов
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1. \u0410\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u0430 \u043F\u0440\u043E\u0435\u043A\u0442\u0430")] }),
      new Table({
        columnWidths: [2340, 2340, 2340, 2340],
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0422\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u044F", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0411\u0430\u0437\u043E\u0432\u044B\u0439 \u043E\u0431\u0440\u0430\u0437", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041F\u043E\u0440\u0442", bold: true, size: 22 })] })] })
            ]
          }),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MySQL", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MySQL 8.0", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "mysql:8.0", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3307", size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Backend", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "FastAPI + Python 3.11", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "python:3.11-slim", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "8000", size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Worker", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Python 3.11 + requests", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "python:3.11-slim", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u2014", size: 22 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Frontend", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Next.js 16 + React 19", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "node:20-alpine", size: 22 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3000", size: 22 })] })] })
          ]})
        ]
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: "\u0422\u0430\u0431\u043B\u0438\u0446\u0430 1. \u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B \u043F\u0440\u043E\u0435\u043A\u0442\u0430 StarLine Monitor", size: 18, italics: true, color: colors.secondary })] }),
      
      // 2. Анализ Dockerfile
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. \u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F Dockerfile")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1. Backend Dockerfile")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 Dockerfile \u0431\u044D\u043A\u0435\u043D\u0434\u0430 \u0438\u043C\u0435\u0435\u0442 \u043F\u0440\u043E\u0441\u0442\u0443\u044E \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 \u0431\u0435\u0437 \u043C\u043D\u043E\u0433\u043E\u044D\u0442\u0430\u043F\u043D\u043E\u0439 \u0441\u0431\u043E\u0440\u043A\u0438 \u0438 \u043A\u044D\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0441\u043B\u043E\u0451\u0432. \u042D\u0442\u043E \u043F\u0440\u0438\u0432\u043E\u0434\u0438\u0442 \u043A \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u043E\u0439 \u043F\u0435\u0440\u0435\u0441\u0431\u043E\u0440\u043A\u0435 \u0438 \u043D\u0435\u043E\u043F\u0442\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u043C\u0443 \u0440\u0430\u0437\u043C\u0435\u0440\u0443 \u043E\u0431\u0440\u0430\u0437\u0430.", size: 24, color: colors.body })] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u041E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u044B:", bold: true, size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-backend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u043A\u044D\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u043F\u0430\u043A\u0435\u0442\u043E\u0432 \u2014 pip \u0443\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438 \u0437\u0430\u043D\u043E\u0432\u043E \u043F\u0440\u0438 \u043A\u0430\u0436\u0434\u043E\u043C \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0438 \u043A\u043E\u0434\u0430", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-backend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u041D\u0435\u0442 \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u0438 \u0434\u043B\u044F production \u2014 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u043C\u043D\u043E\u0433\u043E\u044D\u0442\u0430\u043F\u043D\u0430\u044F \u0441\u0431\u043E\u0440\u043A\u0430 (multi-stage build)", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-backend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F uv \u0438\u043B\u0438 pip-tools \u2014 \u0441\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B \u0443\u0441\u043A\u043E\u0440\u044F\u044E\u0442 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0443 \u0432 10-100 \u0440\u0430\u0437", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-backend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u041D\u0435\u0442 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0439 \u043F\u043E \u043F\u0430\u043C\u044F\u0442\u0438 \u0438 CPU \u0432 runtime", size: 24, color: colors.body })] }),
      
      new Paragraph({ spacing: { line: 312, before: 200 }, children: [new TextRun({ text: "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438 \u043F\u043E \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u0438:", bold: true, size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-backend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C uv \u0432\u043C\u0435\u0441\u0442\u043E pip \u0434\u043B\u044F \u0443\u0441\u043A\u043E\u0440\u0435\u043D\u0438\u044F \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0435\u0439", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-backend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u044D\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0441\u043B\u043E\u0451\u0432: \u0441\u043D\u0430\u0447\u0430\u043B\u0430 requirements.txt, \u043F\u043E\u0442\u043E\u043C \u043A\u043E\u0434", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-backend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C python:3.11-slim-bookworm \u043A\u0430\u043A \u0431\u043E\u043B\u0435\u0435 \u0441\u0442\u0430\u0431\u0438\u043B\u044C\u043D\u0443\u044E \u0431\u0430\u0437\u0443", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-backend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C non-root \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0434\u043B\u044F \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438", size: 24, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2. Worker Dockerfile")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "Worker \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0430\u043D\u0430\u043B\u043E\u0433\u0438\u0447\u043D\u0443\u044E \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 Dockerfile. \u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 backend \u0438 worker \u0432 \u0435\u0434\u0438\u043D\u044B\u0439 \u043E\u0431\u0440\u0430\u0437 \u0441 \u0440\u0430\u0437\u043D\u044B\u043C\u0438 entrypoints \u0434\u043B\u044F \u0441\u043D\u0438\u0436\u0435\u043D\u0438\u044F \u0440\u0430\u0437\u043C\u0435\u0440\u0430 \u043E\u0431\u0449\u0435\u0433\u043E \u043E\u0431\u0440\u0430\u0437\u0430 \u0438 \u0443\u043F\u0440\u043E\u0449\u0435\u043D\u0438\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438.", size: 24, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.3. Frontend Dockerfile")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u0424\u0440\u043E\u043D\u0442\u0435\u043D\u0434 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 multi-stage build, \u0447\u0442\u043E \u0445\u043E\u0440\u043E\u0448\u043E, \u043D\u043E \u0435\u0441\u0442\u044C \u043D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043A\u0438:", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-frontend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F npm install \u0432\u043C\u0435\u0441\u0442\u043E npm ci \u2014 \u043C\u0435\u043D\u044C\u0448\u0430\u044F \u0441\u0442\u0430\u0431\u0438\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0438 \u0431\u043E\u043B\u044C\u0448\u0435\u0435 \u0432\u0440\u0435\u043C\u044F \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-frontend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u041D\u0435\u0442 \u043A\u044D\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F node_modules \u043C\u0435\u0436\u0434\u0443 \u0441\u0431\u043E\u0440\u043A\u0430\u043C\u0438", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-frontend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0412 \u043F\u0440\u043E\u0435\u043A\u0442\u0435 \u0435\u0441\u0442\u044C bun.lock, \u043D\u043E \u0432 Dockerfile \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F npm \u2014 \u043F\u043E\u0442\u0435\u0440\u044F \u043F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0438 bun", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "bullet-frontend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u041D\u0435\u0442 standalone output optimization \u0434\u043B\u044F \u0443\u043C\u0435\u043D\u044C\u0448\u0435\u043D\u0438\u044F \u0440\u0430\u0437\u043C\u0435\u0440\u0430 \u043E\u0431\u0440\u0430\u0437\u0430", size: 24, color: colors.body })] }),
      
      new Paragraph({ spacing: { line: 312, before: 200 }, children: [new TextRun({ text: "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438:", bold: true, size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-frontend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C bun \u0434\u043B\u044F \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u0438 \u0441\u0431\u043E\u0440\u043A\u0438 \u2014 \u0443\u0441\u043A\u043E\u0440\u0435\u043D\u0438\u0435 \u0432 2-5 \u0440\u0430\u0437", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-frontend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u044D\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 .next/cache \u0434\u043B\u044F \u0443\u0441\u043A\u043E\u0440\u0435\u043D\u0438\u044F \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u044B\u0445 \u0441\u0431\u043E\u0440\u043E\u043A", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-frontend", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C output: standalone \u0432 next.config.ts (\u0443\u0436\u0435 \u0435\u0441\u0442\u044C) \u0441 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E\u0439 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u043A\u043E\u0439 static \u0444\u0430\u0439\u043B\u043E\u0432", size: 24, color: colors.body })] }),
      
      // 3. Оптимизация кода
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. \u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u043A\u043E\u0434\u0430")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1. Backend (main.py)")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u0411\u044D\u043A\u0435\u043D\u0434 \u043D\u0430 FastAPI \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u0440\u044F\u0434 \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u043D\u044B\u0445 \u043F\u0440\u043E\u0431\u043B\u0435\u043C, \u0432\u043B\u0438\u044F\u044E\u0449\u0438\u0445 \u043D\u0430 \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0438 \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u0443\u0435\u043C\u043E\u0441\u0442\u044C:", size: 24, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.1.1. \u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430: Connection Pooling")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u041A\u0430\u0436\u0434\u044B\u0439 HTTP-\u0437\u0430\u043F\u0440\u043E\u0441 \u0441\u043E\u0437\u0434\u0430\u0451\u0442 \u043D\u043E\u0432\u043E\u0435 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0441 \u0431\u0430\u0437\u043E\u0439 \u0434\u0430\u043D\u043D\u044B\u0445. \u0424\u0443\u043D\u043A\u0446\u0438\u044F db() \u0441\u043E\u0437\u0434\u0430\u0451\u0442 \u043D\u043E\u0432\u043E\u0435 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u0438 \u043A\u0430\u0436\u0434\u043E\u043C \u0432\u044B\u0437\u043E\u0432\u0435, \u0447\u0442\u043E \u043F\u0440\u0438\u0432\u043E\u0434\u0438\u0442 \u043A \u043F\u043E\u0442\u0435\u0440\u0435 \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u043D\u0430 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 TCP-\u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F, \u0430\u0443\u0442\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044E \u0438 handshake MySQL.", size: 24, color: colors.body })] }),
      new Paragraph({ spacing: { line: 312, before: 200 }, children: [new TextRun({ text: "\u0420\u0435\u0448\u0435\u043D\u0438\u0435: \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C connection pool \u0441 aiomysql \u0438\u043B\u0438 databases[\u0430\u0441\u0438\u043D\u0445]. \u042D\u0442\u043E \u043F\u043E\u0437\u0432\u043E\u043B\u0438\u0442 \u043F\u0435\u0440\u0435\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u0438 \u0443\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C latency \u043D\u0430 50-200ms \u043D\u0430 \u043A\u0430\u0436\u0434\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441.", size: 24, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.1.2. \u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430: \u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u0435 async/\u0430\u0432\u0430\u0438\u0442")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u0412\u0441\u0435 endpoint\u2019\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u044B\u0439 mysql-connector-python, \u0431\u043B\u043E\u043A\u0438\u0440\u0443\u044E\u0449\u0438\u0439 event loop FastAPI. \u042D\u0442\u043E \u043D\u0435\u0433\u0430\u0442\u0438\u0432\u043D\u043E \u0441\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043D\u0430 concurrency \u043F\u0440\u0438 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0435.", size: 24, color: colors.body })] }),
      new Paragraph({ spacing: { line: 312, before: 200 }, children: [new TextRun({ text: "\u0420\u0435\u0448\u0435\u043D\u0438\u0435: \u041F\u0435\u0440\u0435\u0439\u0442\u0438 \u043D\u0430 async \u0434\u0440\u0430\u0439\u0432\u0435\u0440 (aiomysql \u0438\u043B\u0438 asyncmy) \u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C async/await \u0432\u043E \u0432\u0441\u0435\u0445 endpoint\u2019\u0430\u0445. \u041E\u0436\u0438\u0434\u0430\u0435\u043C\u043E\u0435 \u0443\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u0435 throughput: 2-5x \u043F\u0440\u0438 \u0432\u044B\u0441\u043E\u043A\u043E\u0439 \u043D\u0430\u0433\u0440\u0443\u0437\u043A\u0435.", size: 24, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.1.3. \u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430: \u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u0435 \u043A\u044D\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "API \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442 \u0442\u044F\u0436\u0451\u043B\u045B\u0435 SQL-\u0437\u0430\u043F\u0440\u043E\u0441\u044B \u043D\u0430 \u043A\u0430\u0436\u0434\u044B\u0439 \u0437\u0430\u043F\u0440\u043E\u0441, \u0432\u043A\u043B\u044E\u0447\u0430\u044F window functions (ROW_NUMBER) \u0434\u043B\u044F \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0433\u043E \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430.", size: 24, color: colors.body })] }),
      new Paragraph({ spacing: { line: 312, before: 200 }, children: [new TextRun({ text: "\u0420\u0435\u0448\u0435\u043D\u0438\u0435: \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C Redis \u0438\u043B\u0438 in-memory \u043A\u044D\u0448 \u0434\u043B\u044F /api/devices \u0441 TTL 30-60 \u0441\u0435\u043A\u0443\u043D\u0434. \u0414\u043B\u044F /api/service-types \u2014 \u043A\u044D\u0448 TTL 5-10 \u043C\u0438\u043D\u0443\u0442.", size: 24, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2. Worker (worker.py)")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "Worker \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u0441\u043E\u0431\u043E\u0439 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u044B\u0439 Python-\u0441\u043A\u0440\u0438\u043F\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0438\u043E\u0434\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043E\u043F\u0440\u043E\u0441\u0430 StarLine API. \u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u0438:", size: 24, color: colors.body })] }),
      
      new Paragraph({ numbering: { reference: "numbered-worker", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0410\u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u0430\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430: \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C asyncio + aiohttp \u0434\u043B\u044F \u043F\u0430\u0440\u0430\u043B\u043B\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u043E\u043F\u0440\u043E\u0441\u0430 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u0438\u0445 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-worker", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u041F\u043E\u043E\u0431\u0449\u0451\u043D\u043D\u044B\u0439 connection pool: \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0435\u0434\u0438\u043D\u044B\u0439 pool \u0432\u043C\u0435\u0441\u0442\u043E \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u043D\u0430 \u043A\u0430\u0436\u0434\u0443\u044E \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044E", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-worker", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0411\u0430\u0442\u0447\u043D\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0432 \u0411\u0414: \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C executemany \u0434\u043B\u044F \u043C\u0430\u0441\u0441\u043E\u0432\u043E\u0439 \u0432\u0441\u0442\u0430\u0432\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-worker", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "\u0423\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C POLL_INTERVAL \u043F\u0440\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0438 WebSocket \u043E\u0442 StarLine (\u0435\u0441\u043B\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E)", size: 24, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3. Frontend")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u0424\u0440\u043E\u043D\u0442\u0435\u043D\u0434 \u0438\u043C\u0435\u0435\u0442 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0435 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u0441 \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u043E\u0439 \u0438 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u044F\u043C\u0438:", size: 24, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.3.1. \u041C\u043E\u043D\u043E\u043B\u0438\u0442\u043D\u044B\u0439 page.tsx")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u0424\u0430\u0439\u043B page.tsx \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u0431\u043E\u043B\u0435\u0435 1000 \u0441\u0442\u0440\u043E\u043A \u043A\u043E\u0434\u0430 \u0438 \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442: 5+ \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432, \u043C\u043D\u043E\u0433\u043E \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0439, \u0431\u0438\u0437\u043D\u0435\u0441-\u043B\u043E\u0433\u0438\u043A\u0443. \u042D\u0442\u043E \u0437\u0430\u0442\u0440\u0443\u0434\u043D\u044F\u0435\u0442 \u0442\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u043E\u0442\u043B\u0430\u0434\u043A\u0443 \u0438 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0443.", size: 24, color: colors.body })] }),
      new Paragraph({ spacing: { line: 312, before: 200 }, children: [new TextRun({ text: "\u0420\u0435\u0448\u0435\u043D\u0438\u0435: \u0420\u0430\u0437\u0431\u0438\u0442\u044C \u043D\u0430 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0435 \u0444\u0430\u0439\u043B\u044B: useAuth hook, AuthForm, DeviceCard, DeviceDetail, AddDeviceDialog, AddMaintenanceDialog \u0443\u0436\u0435 \u0432\u044B\u043D\u0435\u0441\u0435\u043D\u044B \u0432 components/, \u043D\u043E \u0442\u0440\u0435\u0431\u0443\u044E\u0442 \u0434\u043E\u0440\u0430\u0431\u043E\u0442\u043A\u0438.", size: 24, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.3.2. \u041D\u0435\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C\u044B\u0435 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u0412 package.json \u043C\u043D\u043E\u0433\u043E \u043B\u0438\u0448\u043D\u0438\u0445 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0435\u0439, \u0443\u0432\u0435\u043B\u0438\u0447\u0438\u0432\u0430\u044E\u0449\u0438\u0445 \u0440\u0430\u0437\u043C\u0435\u0440 \u043E\u0431\u0440\u0430\u0437\u0430:", size: 24, color: colors.body })] }),
      
      // Таблица зависимостей
      new Table({
        columnWidths: [3120, 3120, 3120],
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0417\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u044C", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F", bold: true, size: 22 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u044F", bold: true, size: 22 })] })] })
            ]
          }),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "@prisma/client", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F (\u0411\u0414 \u0447\u0435\u0440\u0435\u0437 backend)", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "~15 MB", size: 20 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "next-auth", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F (\u0441\u0432\u043E\u044F auth)", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "~8 MB", size: 20 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "@mdxeditor/editor", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "~25 MB", size: 20 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "react-markdown", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "~3 MB", size: 20 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "next-intl", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "~2 MB", size: 20 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "framer-motion", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "~5 MB", size: 20 })] })] })
          ]})
        ]
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: "\u0422\u0430\u0431\u043B\u0438\u0446\u0430 2. \u041D\u0435\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C\u044B\u0435 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0438 \u0438 \u043F\u043E\u0442\u0435\u043D\u0446\u0438\u0430\u043B \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0438", size: 18, italics: true, color: colors.secondary })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.3.3. UI \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u0412 \u043F\u0440\u043E\u0435\u043A\u0442\u0435 50+ shadcn/ui \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432, \u043D\u043E \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u043A\u043E\u043B\u043E 15-20. \u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u0435\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C\u044B\u0435: accordion, carousel, drawer, menubar, navigation-menu, slider, toggle-group \u0438 \u0434\u0440.", size: 24, color: colors.body })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("3.3.4. React Query \u0438 Zustand")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B @tanstack/react-query \u0438 zustand, \u043D\u043E \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F \u0432 \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u043C \u043A\u043E\u0434\u0435. \u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F: \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C React Query \u0434\u043B\u044F \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F server state (\u043A\u044D\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, refetch, optimistic updates) \u0438 Zustand \u0434\u043B\u044F client state (\u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F, UI state).", size: 24, color: colors.body })] }),
      
      // 4. Docker Compose оптимизация
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. \u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F Docker Compose")] }),
      new Paragraph({ spacing: { line: 312 }, children: [new TextRun({ text: "docker-compose.yml \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0445 \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u0439:", size: 24, color: colors.body })] }),
      
      new Paragraph({ numbering: { reference: "numbered-compose", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Resource limits: \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C deploy.resources \u0434\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0441\u0435\u0440\u0432\u0438\u0441\u0430 (\u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0435 CPU \u0438 \u043F\u0430\u043C\u044F\u0442\u0438)", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-compose", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Healthchecks: \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C healthcheck \u0434\u043B\u044F backend \u0438 frontend (\u0443 MySQL \u0443\u0436\u0435 \u0435\u0441\u0442\u044C)", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-compose", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Logging: \u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C logging driver \u0441 rotation \u0434\u043B\u044F \u043F\u0440\u0435\u0434\u043E\u0442\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u044F \u043F\u0435\u0440\u0435\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u0434\u0438\u0441\u043A\u0430", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-compose", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Networks: \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u0443\u044E network \u0434\u043B\u044F \u0438\u0437\u043E\u043B\u044F\u0446\u0438\u0438 \u0441\u0435\u0440\u0432\u0438\u0441\u043E\u0432", size: 24, color: colors.body })] }),
      new Paragraph({ numbering: { reference: "numbered-compose", level: 0 }, spacing: { line: 312 }, children: [new TextRun({ text: "Environment: \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C env_file \u0432\u043C\u0435\u0441\u0442\u043E \u043F\u0440\u044F\u043C\u043E\u0433\u043E \u0443\u043A\u0430\u0437\u0430\u043D\u0438\u044F environment variables", size: 24, color: colors.body })] }),
      
      // 5. Итоговые рекомендации
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. \u0418\u0442\u043E\u0433\u043E\u0432\u044B\u0435 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438")] }),
      
      // Таблица приоритетов
      new Table({
        columnWidths: [1560, 3120, 2340, 2340],
        margins: { top: 100, bottom: 100, left: 150, right: 150 },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({ borders: cellBorders, width: { size: 1560, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442", bold: true, size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F", bold: true, size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041E\u0436\u0438\u0434\u0430\u0435\u043C\u044B\u0439 \u044D\u0444\u0444\u0435\u043A\u0442", bold: true, size: 20 })] })] }),
              new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, shading: { fill: colors.tableBg, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0421\u043B\u043E\u0436\u043D\u043E\u0441\u0442\u044C", bold: true, size: 20 })] })] })
            ]
          }),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 1560, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0412\u044B\u0441\u043E\u043A\u0438\u0439", size: 20, bold: true, color: "DC2626" })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Connection pooling backend", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2-5x throughput", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0421\u0440\u0435\u0434\u043D\u044F\u044F", size: 20 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 1560, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0412\u044B\u0441\u043E\u043A\u0438\u0439", size: 20, bold: true, color: "DC2626" })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u043B\u0438\u0448\u043D\u0438\u0445 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0435\u0439", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "~60 MB \u043C\u0435\u043D\u044C\u0448\u0435 \u0440\u0430\u0437\u043C\u0435\u0440", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041D\u0438\u0437\u043A\u0430\u044F", size: 20 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 1560, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0412\u044B\u0441\u043E\u043A\u0438\u0439", size: 20, bold: true, color: "DC2626" })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Multi-stage Dockerfile", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "30-50% \u043C\u0435\u043D\u044C\u0448\u0435 \u0440\u0430\u0437\u043C\u0435\u0440 \u043E\u0431\u0440\u0430\u0437\u0430", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0421\u0440\u0435\u0434\u043D\u044F\u044F", size: 20 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 1560, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0421\u0440\u0435\u0434\u043D\u0438\u0439", size: 20, bold: true, color: "CA8A04" })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Bun \u0434\u043B\u044F \u0441\u0431\u043E\u0440\u043A\u0438 frontend", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2-5x \u0443\u0441\u043A\u043E\u0440\u0435\u043D\u0438\u0435 CI/CD", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041D\u0438\u0437\u043A\u0430\u044F", size: 20 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 1560, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0421\u0440\u0435\u0434\u043D\u0438\u0439", size: 20, bold: true, color: "CA8A04" })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0420\u0430\u0437\u0431\u0438\u0435\u043D\u0438\u0435 page.tsx", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041B\u0443\u0447\u0448\u0430\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0421\u0440\u0435\u0434\u043D\u044F\u044F", size: 20 })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: cellBorders, width: { size: 1560, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041D\u0438\u0437\u043A\u0438\u0439", size: 20, bold: true, color: "16A34A" })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 3120, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "React Query \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u041E\u043F\u0442\u0438\u043C\u0438\u0441\u0442\u0438\u0447\u043D\u044B\u0439 UI", size: 20 })] })] }),
            new TableCell({ borders: cellBorders, width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\u0412\u044B\u0441\u043E\u043A\u0430\u044F", size: 20 })] })] })
          ]})
        ]
      }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [new TextRun({ text: "\u0422\u0430\u0431\u043B\u0438\u0446\u0430 3. \u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u0439", size: 18, italics: true, color: colors.secondary })] }),
      
      new Paragraph({ spacing: { line: 312, before: 300 }, children: [new TextRun({ text: "\u0420\u0435\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u044F \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0445 \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u0439 \u043F\u043E\u0437\u0432\u043E\u043B\u0438\u0442 \u0434\u043E\u0441\u0442\u0438\u0447\u044C \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0433\u043E \u0443\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438, \u0443\u043C\u0435\u043D\u044C\u0448\u0435\u043D\u0438\u044F \u0440\u0430\u0437\u043C\u0435\u0440\u0430 \u043E\u0431\u0440\u0430\u0437\u043E\u0432 \u0438 \u0443\u043F\u0440\u043E\u0449\u0435\u043D\u0438\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430. \u041D\u0430\u0447\u0430\u0442\u044C \u0441\u043B\u0435\u0434\u0443\u0435\u0442 \u0441 \u0432\u044B\u0441\u043E\u043A\u043E\u043F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442\u043D\u044B\u0445 \u0437\u0430\u0434\u0430\u0447: connection pooling \u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u043B\u0438\u0448\u043D\u0438\u0445 \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u0435\u0439.", size: 24, color: colors.body })] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/home/z/my-project/download/StarLine_Optimization_Report.docx", buffer);
  console.log("Document created successfully!");
});
