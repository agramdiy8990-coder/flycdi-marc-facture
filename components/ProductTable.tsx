import React, { useState, useMemo } from 'react';
import { type Product } from '../types';

interface ProductTableProps {
  products: Product[];
  headers: string[];
  selectedProducts?: Product[];
  onProductSelect?: (product: Product, isSelected: boolean) => void;
  onQuantityChange: (product: Product, newQuantity: string) => void;
  isSelectionMode?: boolean;
  quantityHeader?: string;
  onProductRemove?: (product: Product) => void;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const QuantityInput: React.FC<{
    product: Product;
    header: string;
    onQuantityChange: (product: Product, newQuantity: string) => void;
}> = ({ product, header, onQuantityChange }) => {
    return (
        <input
            type="text"
            inputMode="decimal"
            className="block w-24 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-center"
            value={product[header] ?? ''}
            onChange={(e) => onQuantityChange(product, e.target.value)}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.stopPropagation()} // Crucial: Prevent row click when editing quantity
            aria-label="Quantité"
        />
    );
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    const totalStars = 5;
    const filledStars = Math.round(Math.max(0, Math.min(rating, totalStars)));

    return (
        <div className="flex items-center">
            {[...Array(totalStars)].map((_, index) => {
                const starClass = index < filledStars ? "text-yellow-400" : "text-gray-300";
                return (
                    <svg key={index} className={`w-5 h-5 ${starClass}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                );
            })}
        </div>
    );
};

// Assigns intelligent widths and responsive visibility to columns
const getColumnClasses = (header: string): string => {
    const lowerHeader = header.toLowerCase();

    // On mobile, Quality is shown below the Name, so we hide the Quality column.
    const isQualityColumn = ['qualité', 'quality'].some(n => lowerHeader.includes(n));
    if (isQualityColumn) {
        return 'hidden md:table-cell';
    }

    // On smaller screens, hide less critical columns like ID and unit price
    // to ensure the Action (delete) button is always visible.
    const isIdColumn = ['id', 'réf', 'identifiant'].some(n => lowerHeader.includes(n));
    const isUnitPriceColumn = ['prix', 'price', 'pu', 'p.u'].some(n => lowerHeader.includes(n) && !lowerHeader.includes('total'));

    if (isIdColumn || isUnitPriceColumn) {
        return 'hidden md:table-cell';
    }
    
    // Define widths for visible columns
    if (['nom du produit', 'product name', 'nom', 'nomenclature'].some(n => lowerHeader.includes(n))) {
        // Take more space on mobile
        return 'w-2/5 lg:w-1/3';
    }

    if (['quantité', 'quantity', 'qte'].some(n => lowerHeader.includes(n))) {
        return 'w-28';
    }
    
    return ''; // Let other columns like Quality and Total Price auto-size
};


const ProductTable: React.FC<ProductTableProps> = ({
  products,
  headers,
  selectedProducts = [],
  // FIX: Corrected the default prop for onProductSelect.
  // The original default function `() => {}` did not accept any arguments,
  // causing an error when it was called with two arguments on line 163.
  // The new default function correctly accepts two (unused) arguments to match the type signature.
  onProductSelect = (_product, _isSelected) => {},
  onQuantityChange,
  isSelectionMode = true,
  quantityHeader,
  onProductRemove,
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(null);

  const idHeader = useMemo(() => headers.find(h => ['id', 'identifiant', 'réf'].some(n => h.toLowerCase().includes(n))), [headers]);
  const qualityHeader = useMemo(() => headers.find(h => ['qualité', 'quality'].some(n => h.toLowerCase().includes(n))), [headers]);
  const nomenclatureHeader = useMemo(() => headers.find(h => ['nom', 'product', 'nomenclature'].some(n => h.toLowerCase().includes(n))), [headers]);


  const sortedProducts = useMemo(() => {
    let sortableItems = [...products];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        const numA = parseFloat(String(aValue).replace(',', '.'));
        const numB = parseFloat(String(bValue).replace(',', '.'));

        if (!isNaN(numA) && !isNaN(numB)) {
            return sortConfig.direction === 'ascending' ? numA - numB : numB - numA;
        }

        const stringA = String(aValue).toLowerCase();
        const stringB = String(bValue).toLowerCase();

        if (stringA < stringB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (stringA > stringB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [products, sortConfig]);

  const requestSort = (key: string) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const isProductSelected = (product: Product): boolean => {
    if (!idHeader) {
      const productString = JSON.stringify(product);
      return selectedProducts.some(p => JSON.stringify(p) === productString);
    }
    return selectedProducts.some(p => p[idHeader] === product[idHeader]);
  };

  return (
    <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-x-auto">
      <table className="w-full table-auto divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none ${getColumnClasses(header)}`}
                onClick={() => requestSort(header)}
              >
                {header}
                {sortConfig && sortConfig.key === header && (
                    <span className="ml-1">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
            {onProductRemove && (
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Action
                </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedProducts.map((product, rowIndex) => {
            const isSelected = isProductSelected(product);
            return (
              <tr 
                key={idHeader ? String(product[idHeader]) : rowIndex} 
                className={`transition-colors duration-150 ${isSelected ? 'bg-sky-100' : 'hover:bg-gray-50'} ${isSelectionMode ? 'cursor-pointer' : ''}`}
                onClick={() => {
                    if (isSelectionMode) {
                        onProductSelect(product, !isSelected)
                    }
                }}
              >
                {headers.map((header) => (
                  <td key={header} className={`px-3 py-4 text-sm text-gray-700 break-words ${getColumnClasses(header)}`}>
                    {(() => {
                      if (header === nomenclatureHeader) {
                          const qualityValue = qualityHeader ? product[qualityHeader] : null;
                          const rating = qualityValue !== null ? parseFloat(String(qualityValue).replace(',', '.')) : NaN;
                          
                          return (
                              <div>
                                  <span>{String(product[header] ?? '')}</span>
                                  {qualityHeader && (
                                      <div className="md:hidden mt-1"> 
                                          {!isNaN(rating) ? <StarRating rating={rating} /> : <span className="text-gray-500 text-xs">{String(qualityValue ?? '')}</span>}
                                      </div>
                                  )}
                              </div>
                          );
                      }
                      if (header === quantityHeader) {
                        return <QuantityInput product={product} header={header} onQuantityChange={onQuantityChange} />;
                      }
                      if (header === qualityHeader) {
                          const rating = parseFloat(String(product[header]).replace(',', '.'));
                          return !isNaN(rating) ? <StarRating rating={rating} /> : String(product[header] ?? '');
                      }
                      return String(product[header] ?? '');
                    })()}
                  </td>
                ))}
                {onProductRemove && (
                    <td className="px-3 py-4 text-sm text-gray-700 text-center">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onProductRemove(product);
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors duration-200 p-1 rounded-full hover:bg-red-100"
                            aria-label="Supprimer le produit"
                        >
                           <TrashIcon />
                        </button>
                    </td>
                )}
              </tr>
            )}
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;