import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrivateNoteRow } from './notes.service';

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string }[];
}

const HEADING_SIZES: Record<number, number> = { 1: 22, 2: 18, 3: 15 };

@Injectable()
export class NotesPdfService {
  /** Renders a note's Tiptap JSON doc into a PDF buffer, ready to stream/download. */
  async renderToBuffer(note: PrivateNoteRow): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 56, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc.font('Helvetica-Bold').fontSize(20).text(note.title || 'Untitled note');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9).fillColor('#666666')
      .text(`Exported ${new Date().toLocaleString()}`);
    doc.fillColor('#000000');
    doc.moveDown(1);

    const root = note.content_json as unknown as TiptapNode;
    for (const node of root?.content ?? []) {
      this.renderBlock(doc, node);
    }

    doc.end();
    return done;
  }

  private renderBlock(doc: PDFKit.PDFDocument, node: TiptapNode, indent = 0): void {
    switch (node.type) {
      case 'heading': {
        const level = Number(node.attrs?.level ?? 1);
        doc.font('Helvetica-Bold').fontSize(HEADING_SIZES[level] ?? 13);
        this.renderInline(doc, node.content ?? []);
        doc.moveDown(0.6);
        break;
      }
      case 'paragraph': {
        doc.font('Helvetica').fontSize(11);
        if (!node.content || node.content.length === 0) {
          doc.moveDown(0.5);
        } else {
          this.renderInline(doc, node.content, indent);
          doc.moveDown(0.5);
        }
        break;
      }
      case 'blockquote': {
        doc.font('Helvetica-Oblique').fontSize(11).fillColor('#555555');
        for (const child of node.content ?? []) {
          this.renderBlock(doc, child, indent + 20);
        }
        doc.fillColor('#000000');
        break;
      }
      case 'bulletList':
      case 'orderedList': {
        let index = 1;
        for (const item of node.content ?? []) {
          const prefix = node.type === 'bulletList' ? '•  ' : `${index}.  `;
          doc.font('Helvetica').fontSize(11);
          doc.text(prefix, { continued: true, indent: indent + 14 });
          for (const child of item.content ?? []) {
            if (child.type === 'paragraph') {
              this.renderInline(doc, child.content ?? []);
            } else {
              this.renderBlock(doc, child, indent + 28);
            }
          }
          index++;
        }
        doc.moveDown(0.3);
        break;
      }
      default:
        // Unknown/unsupported node types are skipped rather than crashing export.
        break;
    }
  }

  private renderInline(doc: PDFKit.PDFDocument, nodes: TiptapNode[], indent = 0): void {
    nodes.forEach((node, i) => {
      if (node.type !== 'text' || !node.text) return;

      const markTypes = new Set((node.marks ?? []).map((m) => m.type));
      let font = 'Helvetica';
      if (markTypes.has('bold') && markTypes.has('italic')) font = 'Helvetica-BoldOblique';
      else if (markTypes.has('bold')) font = 'Helvetica-Bold';
      else if (markTypes.has('italic')) font = 'Helvetica-Oblique';

      doc.font(markTypes.has('code') ? 'Courier' : font);
      const isLast = i === nodes.length - 1;
      doc.text(node.text, { continued: !isLast, indent: i === 0 ? indent : undefined });
    });
  }
}
