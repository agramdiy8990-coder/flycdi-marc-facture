import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { type Product } from '../types';

/**
 * Parses an Excel or CSV file and returns the headers and product data.
 * @param file The file to parse.
 * @returns A promise that resolves to an object containing products and headers.
 */
export const parseExcelFile = (file: File): Promise<{ products: Product[], headers: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    reject(new Error("Échec de la lecture des données du fichier."));
                    return;
                }
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                if (!sheetName) {
                    reject(new Error("Aucune feuille trouvée dans le fichier Excel."));
                    return;
                }
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                if (jsonData.length < 1) {
                    resolve({ products: [], headers: [] });
                    return;
                }

                const headers: string[] = jsonData[0].map(String);
                const products: Product[] = jsonData.slice(1).map(row => {
                    const product: Product = {};
                    headers.forEach((header, index) => {
                        product[header] = row[index] ?? '';
                    });
                    return product;
                }).filter(p => headers.some(h => p[h] !== '' && p[h] !== null && p[h] !== undefined));

                resolve({ products, headers });
            } catch (error) {
                console.error("Erreur lors de l'analyse du fichier Excel:", error);
                reject(new Error("Format de fichier invalide ou fichier corrompu."));
            }
        };

        reader.onerror = (error) => {
            console.error("Erreur du lecteur de fichier:", error);
            reject(new Error("Une erreur s'est produite lors de la lecture du fichier."));
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * Downloads selected products as a formatted XLSX file, mirroring the preview.
 */
export const downloadXLSX = (
    products: Product[],
    displayHeaders: string[],
    grandTotal: number,
    invoiceDetails: {
        logo: string | null;
        date: string;
        clientName: string;
        clientAddress: string;
        clientCity: string;
        invoiceSubtitle: string;
    }
) => {
    const wb = XLSX.utils.book_new();
    const ws_data: (string | number | null)[][] = [
        [null, null, null, null, 'DEVIS', null],
        [null, null, null, null, 'DATE :', invoiceDetails.date],
        [null, null, null, null, 'Clt :', invoiceDetails.clientName],
        [null, null, null, null, 'Adresse :', invoiceDetails.clientAddress],
        [null, null, null, null, 'VILLE :', invoiceDetails.clientCity],
        [null],
        [invoiceDetails.invoiceSubtitle],
        [null],
    ];

    // Table Headers
    ws_data.push(displayHeaders);

    // Table Body
    products.forEach(product => {
        const row = displayHeaders.map(header => product[header]);
        ws_data.push(row);
    });

    // Spacer
    ws_data.push([null]);

    // Footer
    const formattedGrandTotal = grandTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    ws_data.push([null, null, null, null, "Total Général :", formattedGrandTotal]);
    ws_data.push([null]);
    
    // Static Footer
    ws_data.push(["Quartier Al Massira 1, Habous, en face de la mosquee HAMZA, Marrakech-Maroc"]);
    ws_data.push(["Capital : 1 000 000 DH / I.C.E : 003530607000070 / R.C : 151549 / I.F : 66003685 / N° CNSS : 5399475"]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // --- Merging and Styling for perfect layout ---
    ws['!merges'] = [
        // Merging for the logo area (approximated)
        { s: { r: 0, c: 0 }, e: { r: 4, c: 3 } }, 
        // Merging for DEVIS, Date, Clt, etc. to align them
        { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } },
        // Merging for Subtitle
        { s: { r: 6, c: 0 }, e: { r: 6, c: 5 } },
        // Merging for Footer address
        { s: { r: ws_data.length - 2, c: 0 }, e: { r: ws_data.length - 2, c: 5 } },
        // Merging for Footer legal
        { s: { r: ws_data.length - 1, c: 0 }, e: { r: ws_data.length - 1, c: 5 } },
    ];
    
    // Set column widths for better appearance to match preview
    ws['!cols'] = [
        { wch: 40 }, // Nomenclature
        { wch: 12 }, // ID
        { wch: 15 }, // Qualité
        { wch: 10 }, // Quantité
        { wch: 15 }, // Prix d'achat
        { wch: 15 }, // Prix Total
    ];

    // It's not straightforward to add images with this library, so we leave space for it.
    // The user can add it manually or we can note this limitation.
    // For now, the structure is the priority.

    XLSX.utils.book_append_sheet(wb, ws, 'Devis');
    XLSX.writeFile(wb, `devis_${invoiceDetails.clientName.replace(/\s/g, '_') || 'selection'}.xlsx`);
};


/**
 * Downloads a captured HTML element as a multi-page PDF file if content overflows.
 */
export const downloadPDF = async (element: HTMLElement) => {
    // 1. Generate a single, high-quality canvas of the entire component.
    const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        // Ensure the canvas captures the full height, not just the visible part
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // 2. Set up PDF document properties.
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // 3. Calculate the dimensions of the image when scaled to fit the PDF width.
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasHeight / canvasWidth;
    const imgTotalHeight = pdfWidth * ratio;

    // 4. Paginate the image, slicing it across multiple pages if it's too tall.
    let heightLeft = imgTotalHeight;
    let position = 0;

    // Add the first page
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgTotalHeight);
    heightLeft -= pdfHeight;

    // Add subsequent pages if the content overflows
    while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        // The y-position is shifted up to reveal the next slice of the image
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgTotalHeight);
        heightLeft -= pdfHeight;
    }
    
    pdf.save('devis.pdf');
};