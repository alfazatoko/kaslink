declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean; logging?: boolean };
    jsPDF?: { unit?: string; format?: string; orientation?: string };
  }

  interface Html2PdfInstance {
    set(opt: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement | null): Html2PdfInstance;
    save(): Promise<void>;
    outputPdf(type: 'blob'): Promise<Blob>;
  }

  function html2pdf(): Html2PdfInstance;
  export default html2pdf;
}