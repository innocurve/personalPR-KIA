declare module '@prisma/client' {
  interface PdfChunk {
    id: string;
    content: string;
    metadata?: any;
    keywords: string[];
    embedding?: any;
    fileName: string;
    createdAt: Date;
    updatedAt: Date;
  }
} 