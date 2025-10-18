import React, { useState, useMemo, useRef, useEffect } from 'react';
import { type Product } from '../types';
import ProductTable from './ProductTable';
import InvoicePreview from './InvoicePreview';
import { downloadXLSX, downloadPDF } from '../services/csvService';

interface SelectedPageProps {
  selectedProducts: Product[];
  headers: string[];
  onQuantityChange: (product: Product, newQuantity: string) => void;
  onProductRemove: (product: Product) => void;
}

const SelectedPage: React.FC<SelectedPageProps> = ({
  selectedProducts,
  headers,
  onQuantityChange,
  onProductRemove,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
  const [invoiceSubtitle, setInvoiceSubtitle] = useState("MOBILLE PHONE DISPLYAY BATTERY");
  const [logo, setLogo] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);


  const invoicePreviewRef = useRef<HTMLDivElement>(null);

  // Load logo from localStorage on component mount
  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem('savedLogo');
      if (savedLogo) {
        setLogo(savedLogo);
      }
    } catch (error) {
      console.error("Failed to load logo from localStorage:", error);
    }
  }, []);

  // Dynamically identify key headers
  const nomenclatureHeader = useMemo(() => headers.find(h => ['nom', 'product', 'nomenclature'].some(n => h.toLowerCase().includes(n))), [headers]);
  const idHeader = useMemo(() => headers.find(h => ['id', 'réf', 'identifiant'].some(n => h.toLowerCase().includes(n))), [headers]);
  const qualityHeader = useMemo(() => headers.find(h => ['qualité', 'quality'].some(n => h.toLowerCase().includes(n))), [headers]);
  const quantityHeader = useMemo(() => headers.find(h => ['quantité', 'qte', 'quantity'].some(n => h.toLowerCase().includes(n))), [headers]);
  const priceHeader = useMemo(() => headers.find(h => ['prix', 'price', 'pu', 'p.u'].some(n => h.toLowerCase().includes(n) && !h.toLowerCase().includes('total'))), [headers]);
  const totalHeader = 'Prix Total'; // We will create this header

  const displayHeaders = useMemo(() => {
    return [
        nomenclatureHeader,
        idHeader,
        qualityHeader,
        quantityHeader,
        priceHeader,
        totalHeader
    ].filter(Boolean) as string[];
  }, [nomenclatureHeader, idHeader, qualityHeader, quantityHeader, priceHeader, totalHeader]);


  const { productsWithTotal, grandTotal } = useMemo(() => {
    if (!quantityHeader || !priceHeader) {
      return { productsWithTotal: selectedProducts.map(p => ({...p, [totalHeader]: 'N/A' })), grandTotal: 0 };
    }
    
    let total = 0;
    const products = selectedProducts.map(p => {
      const quantity = parseFloat(String(p[quantityHeader] || '0').replace(',', '.'));
      const price = parseFloat(String(p[priceHeader] || '0').replace(',', '.'));
      const productTotal = (isNaN(quantity) || isNaN(price)) ? 0 : quantity * price;
      total += productTotal;
      return {
        ...p,
        [totalHeader]: productTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      };
    });
    
    return { productsWithTotal: products, grandTotal: total };
  }, [selectedProducts, quantityHeader, priceHeader, totalHeader]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogo(result);
        try {
            localStorage.setItem('savedLogo', result);
        } catch (error) {
            console.error("Failed to save logo to localStorage:", error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
      try {
          localStorage.removeItem('savedLogo');
          setLogo(null);
      } catch (error) {
          console.error("Failed to remove logo from localStorage:", error);
      }
  };
  
  const handleDownloadXLSX = () => {
      downloadXLSX(productsWithTotal, displayHeaders, grandTotal, {
          logo,
          date: new Date(invoiceDate).toLocaleDateString('fr-FR'),
          clientName,
          clientAddress,
          clientCity,
          invoiceSubtitle,
      });
  };

  const handleDownloadPDF = async () => {
    // Re-show the preview temporarily if it's not open to ensure the ref is populated
    const wasPreviewHidden = !isPreviewOpen;
    if (wasPreviewHidden) {
        setIsPreviewOpen(true);
        // We need to wait for the next render cycle for the ref to be attached
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (invoicePreviewRef.current) {
      await downloadPDF(invoicePreviewRef.current);
    } else {
        console.error("Preview element not found for PDF generation.");
    }
    
    if (wasPreviewHidden) {
        setIsPreviewOpen(false);
    }
  };

  if (selectedProducts.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800">لا يوجد منتجات مختارة</h2>
        <p className="mt-2 text-gray-600">الرجاء اختيار المنتجات من الصفحة الرئيسية أولاً.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 order-2 lg:order-1">
            <ProductTable
                products={productsWithTotal}
                headers={displayHeaders}
                onQuantityChange={onQuantityChange}
                onProductRemove={onProductRemove}
                isSelectionMode={false}
                quantityHeader={quantityHeader}
            />
        </div>

        <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-24">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">تفاصيل الفاتورة</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">شعار الشركة</label>
                        <div className="mt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <label className="flex-grow flex items-center justify-center px-4 py-2 bg-white text-sky-600 rounded-lg shadow-sm tracking-wide border border-sky-600 cursor-pointer hover:bg-sky-100 transition-colors duration-200">
                                <span>تغيير</span>
                                <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden"/>
                            </label>
                            {logo && (
                                <button onClick={handleRemoveLogo} className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors duration-200">
                                    إزالة الشعار
                                </button>
                            )}
                        </div>
                         {logo && <img src={logo} alt="معاينة الشعار" className="mt-4 max-h-20 border p-1 rounded-md" />}
                    </div>
                    <div>
                        <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700">التاريخ</label>
                        <input type="date" id="invoiceDate" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">اسم العميل</label>
                        <input type="text" id="clientName" value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700">عنوان العميل</label>
                        <input type="text" id="clientAddress" value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="clientCity" className="block text-sm font-medium text-gray-700">المدينة</label>
                        <input type="text" id="clientCity" value={clientCity} onChange={e => setClientCity(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="invoiceSubtitle" className="block text-sm font-medium text-gray-700">العنوان الرئيسي للفاتورة</label>
                        <input type="text" id="invoiceSubtitle" value={invoiceSubtitle} onChange={e => setInvoiceSubtitle(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                    </div>
                </div>

                <div className="mt-6 flex flex-col space-y-3">
                    <button onClick={() => setIsPreviewOpen(true)} className="w-full px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 transition-colors duration-200">
                        معاينة
                    </button>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handleDownloadXLSX} className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors duration-200">
                            تحميل Excel
                        </button>
                        <button onClick={handleDownloadPDF} className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-colors duration-200">
                            تحميل PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
      
      {/* Visible Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-start z-50 overflow-auto p-4" onClick={() => setIsPreviewOpen(false)}>
            <div className="bg-white shadow-2xl max-w-4xl w-full my-8 relative transform scale-50 sm:scale-75 lg:scale-95" onClick={e => e.stopPropagation()}>
                <InvoicePreview
                    ref={invoicePreviewRef} // Attach ref here for PDF generation from visible preview
                    logo={logo}
                    invoiceDetails={{
                        date: new Date(invoiceDate).toLocaleDateString('fr-FR'),
                        clientName,
                        clientAddress,
                        clientCity,
                        invoiceSubtitle,
                    }}
                    products={productsWithTotal}
                    displayHeaders={displayHeaders}
                    grandTotal={grandTotal}
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default SelectedPage;