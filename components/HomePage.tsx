import React, { useState, useMemo } from 'react';
import { type Product } from '../types';
import { parseExcelFile } from '../services/csvService';
import ProductTable from './ProductTable';

interface HomePageProps {
  allProducts: Product[];
  selectedProducts: Product[];
  setAllProducts: (products: Product[]) => void;
  setHeaders: (headers: string[]) => void;
  headers: string[];
  onProductSelect: (product: Product, isSelected: boolean) => void;
  resetState: () => void;
  onQuantityChange: (product: Product, newQuantity: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  allProducts,
  selectedProducts,
  setAllProducts,
  setHeaders,
  headers,
  onProductSelect,
  resetState,
  onQuantityChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Identify essential headers from the raw list
  const nomenclatureHeader = useMemo(() => headers.find(h => ['nom', 'product', 'nomenclature'].some(n => h.toLowerCase().includes(n))), [headers]);
  const qualityHeader = useMemo(() => headers.find(h => ['qualité', 'quality'].some(n => h.toLowerCase().includes(n))), [headers]);
  const quantityHeader = useMemo(() => headers.find(h => ['quantité', 'quantity', 'qte'].some(n => h.toLowerCase().includes(n))), [headers]);

  // Create a focused list of headers for display in the selection table
  const displayHeaders = useMemo(() => {
      return [
          nomenclatureHeader,
          qualityHeader,
          quantityHeader,
      ].filter(Boolean) as string[];
  }, [nomenclatureHeader, qualityHeader, quantityHeader]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      setFileName(file.name);
      try {
        let { products, headers } = await parseExcelFile(file);

        // FIX: Check for a quantity column and add a default if it's missing.
        // This ensures calculations on the selected page will always work.
        let currentQuantityHeader = headers.find(h => ['quantité', 'quantity', 'qte'].some(n => h.toLowerCase().includes(n)));
        if (!currentQuantityHeader) {
            currentQuantityHeader = 'Quantité';
            headers.push(currentQuantityHeader);
            products = products.map(p => ({
                ...p,
                [currentQuantityHeader!]: '1'
            }));
        }

        setAllProducts(products);
        setHeaders(headers);

        // Save to localStorage for persistence
        try {
            localStorage.setItem('allProducts', JSON.stringify(products));
            localStorage.setItem('headers', JSON.stringify(headers));
        } catch (storageError) {
            console.error("Could not save to localStorage:", storageError);
            // Non-critical error: the app still works for the current session
            setError("Les données ont été chargées, mais n'ont pas pu être sauvegardées pour les prochaines visites.");
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
        resetState(); // Clear everything on error
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return allProducts;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return allProducts.filter(product => {
      return Object.values(product).some(value =>
        String(value).toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [allProducts, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {allProducts.length > 0 ? '1. Mettre à jour le fichier de produits' : '1. Charger le fichier de produits'}
        </h2>
        <p className="text-gray-600 mb-4">
            {allProducts.length > 0
                ? 'Les données sont déjà chargées. Chargez un nouveau fichier pour les remplacer ou supprimez les données pour recommencer.'
                : 'Chargez un fichier Excel (.xlsx, .xls) ou CSV (.csv) contenant votre liste de produits.'}
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="w-full sm:w-64 flex flex-col items-center px-4 py-2 bg-white text-sky-600 rounded-lg shadow-md tracking-wide uppercase border border-sky-600 cursor-pointer hover:bg-sky-600 hover:text-white transition-colors duration-200">
                <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4 4-4-4h3V9h2v2z" />
                </svg>
                <span className="mt-2 text-base leading-normal">Choisir un fichier</span>
                <input type='file' className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
            </label>
            {fileName && <span className="text-gray-700">{fileName}</span>}
            {allProducts.length > 0 && (
                <button
                    onClick={resetState}
                    className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors duration-200"
                >
                    Supprimer les données
                </button>
            )}
        </div>
        {isLoading && <p className="mt-4 text-sky-600">Chargement du fichier...</p>}
        {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      </div>

      {allProducts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">2. Sélectionner les produits</h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher des produits..."
              className="block w-full md:w-1/3 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ProductTable
            products={filteredProducts}
            headers={displayHeaders}
            selectedProducts={selectedProducts}
            onProductSelect={onProductSelect}
            onQuantityChange={onQuantityChange}
            isSelectionMode={true}
            quantityHeader={quantityHeader}
          />
        </div>
      )}
    </div>
  );
};

export default HomePage;