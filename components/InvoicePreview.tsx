import React from 'react';
import { Product } from '../types';

interface InvoicePreviewProps {
    logo: string | null;
    invoiceDetails: {
        date: string;
        clientName: string;
        clientAddress: string;
        clientCity: string;
        invoiceSubtitle: string;
    };
    products: Product[];
    displayHeaders: string[];
    grandTotal: number;
}

const InvoicePreview = React.forwardRef<HTMLDivElement, InvoicePreviewProps>(({
    logo,
    invoiceDetails,
    products,
    displayHeaders,
    grandTotal
}, ref) => {
    return (
        <div ref={ref} className="bg-white p-8 font-sans text-gray-900" style={{ width: '210mm', minHeight: '297mm', margin: 'auto' }}>
            {/* Header */}
            <header className="grid grid-cols-2 gap-8 items-start mb-8 pb-4 border-b-2 border-gray-200">
                <div className="flex items-center">
                    {logo ? (
                        <img src={logo} alt="شعار الشركة" className="max-h-28 max-w-full" />
                    ) : (
                        <div className="h-28 w-full bg-gray-100 border flex items-center justify-center text-gray-400">
                           شعار
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 pr-8">DEVIS</h1>
                    <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
                        <strong className="text-right text-gray-600">DATE :</strong>
                        <span className="text-left font-medium">{invoiceDetails.date}</span>
                        <strong className="text-right text-gray-600">Clt :</strong>
                        <span className="text-left font-medium">{invoiceDetails.clientName || '-'}</span>
                         <strong className="text-right text-gray-600">Adresse :</strong>
                        <span className="text-left font-medium">{invoiceDetails.clientAddress || '-'}</span>
                        <strong className="text-right text-gray-600">VILLE :</strong>
                        <span className="text-left font-medium">{invoiceDetails.clientCity || '-'}</span>
                    </div>
                </div>
            </header>

            {/* Subtitle */}
            <section className="text-center my-8">
                <p className="font-bold text-lg tracking-wider text-gray-800">{invoiceDetails.invoiceSubtitle}</p>
            </section>

            {/* Products Table */}
            <main>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-800 text-white">
                            {displayHeaders.map(header => (
                                <th key={header} className="p-3 border border-gray-300 font-semibold text-sm">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {products && products.length > 0 ? (
                            products.map((product, index) => (
                                <tr key={index} className="border-b bg-white even:bg-gray-50">
                                    {displayHeaders.map(header => (
                                         <td key={header} className="p-2 border border-gray-300 text-sm text-gray-800">
                                             {String(product[header] ?? '')}
                                         </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={displayHeaders.length || 1} className="p-4 text-center text-gray-500">
                                    لا توجد منتجات لعرضها.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </main>

            {/* Footer */}
            <footer className="mt-8">
                 <div className="flex justify-end">
                    <div className="w-2/5 mt-4">
                        <div className="flex justify-between p-3 bg-gray-100 border-t-4 border-gray-800 font-bold text-lg tracking-normal">
                            <span className="text-gray-900">Total Général :</span>
                            <span className="text-blue-600">{grandTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
                
                <div className="text-center text-xs text-gray-700 mt-16 pt-4 border-t-2 border-gray-300 w-full">
                    <p className="font-bold text-red-600 mb-1 break-all tracking-normal">Quartier Al Massira 1, Habous, en face de la mosquee HAMZA, Marrakech-Maroc</p>
                    <p className="break-all tracking-normal">Capital : 1 000 000 DH / I.C.E : 003530607000070 / R.C : 151549 / I.F : 66003685 / N° CNSS : 5399475</p>
                </div>
            </footer>
        </div>
    );
});

export default InvoicePreview;