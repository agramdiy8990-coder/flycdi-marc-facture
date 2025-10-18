import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { type Product } from './types';
import Header from './components/Header';
// FIX: Corrected import paths to be relative.
import HomePage from './components/HomePage';
import SelectedPage from './components/SelectedPage';

const App: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem('allProducts');
      const savedHeaders = localStorage.getItem('headers');

      if (savedProducts && savedHeaders) {
        setAllProducts(JSON.parse(savedProducts));
        setHeaders(JSON.parse(savedHeaders));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      // Clear potentially corrupted data
      localStorage.removeItem('allProducts');
      localStorage.removeItem('headers');
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleProductSelect = (product: Product, isSelected: boolean) => {
    const idHeader = headers.find(h => ['id', 'identifiant', 'réf'].some(n => h.toLowerCase().includes(n)));

    if (isSelected) {
      if (idHeader && selectedProducts.some(p => p[idHeader] === product[idHeader])) {
        return; // Prevent adding duplicates
      }
      setSelectedProducts((prev) => [...prev, product]);
    } else {
      if (idHeader) {
        setSelectedProducts((prev) => prev.filter((p) => p[idHeader] !== product[idHeader]));
      } else {
        setSelectedProducts((prev) =>
          prev.filter((p) => JSON.stringify(p) !== JSON.stringify(product))
        );
      }
    }
  };
  
  const handleQuantityChange = (productToUpdate: Product, newQuantity: string) => {
    const quantityHeader = headers.find(h => ['quantité', 'quantity', 'qte'].some(n => h.toLowerCase().includes(n)));
    const idHeader = headers.find(h => ['id', 'identifiant', 'réf'].some(n => h.toLowerCase().includes(n)));

    if (!quantityHeader || !idHeader) return;

    const numericQuantity = Math.max(0, parseFloat(newQuantity.replace(',', '.')) || 0);

    setSelectedProducts(prev =>
      prev.map(p =>
        p[idHeader] === productToUpdate[idHeader]
          ? { ...p, [quantityHeader]: String(numericQuantity) }
          : p
      )
    );
  };

  const handleAllProductQuantityChange = (productToUpdate: Product, newQuantity: string) => {
    const quantityHeader = headers.find(h => ['quantité', 'quantity', 'qte'].some(n => h.toLowerCase().includes(n)));
    const idHeader = headers.find(h => ['id', 'identifiant', 'réf'].some(n => h.toLowerCase().includes(n)));

    if (!quantityHeader || !idHeader) return;

    const numericQuantity = Math.max(0, parseFloat(newQuantity.replace(',', '.')) || 0);
    const newQuantityStr = String(numericQuantity);

    // Update allProducts state
    setAllProducts(prev =>
      prev.map(p =>
        p[idHeader] === productToUpdate[idHeader]
          ? { ...p, [quantityHeader]: newQuantityStr }
          : p
      )
    );

    // Also update selectedProducts if the product is there to keep them in sync
    setSelectedProducts(prev =>
      prev.map(p =>
        p[idHeader] === productToUpdate[idHeader]
          ? { ...p, [quantityHeader]: newQuantityStr }
          : p
      )
    );
  };
  
  const handleProductRemove = (productToRemove: Product) => {
    const idHeader = headers.find(h => ['id', 'identifiant', 'réf'].some(n => h.toLowerCase().includes(n)));
    if (idHeader) {
        setSelectedProducts((prev) => prev.filter((p) => p[idHeader] !== productToRemove[idHeader]));
      } else {
        setSelectedProducts((prev) =>
          prev.filter((p) => JSON.stringify(p) !== JSON.stringify(productToRemove))
        );
      }
  };

  const resetState = () => {
      setAllProducts([]);
      setSelectedProducts([]);
      setHeaders([]);
      try {
        localStorage.removeItem('allProducts');
        localStorage.removeItem('headers');
      } catch (error) {
          console.error("Failed to clear data from localStorage:", error);
      }
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        <Header selectedCount={selectedProducts.length} />
        <main className="p-4 sm:p-6 md:p-8">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  allProducts={allProducts}
                  selectedProducts={selectedProducts}
                  setAllProducts={setAllProducts}
                  setHeaders={setHeaders}
                  headers={headers}
                  onProductSelect={handleProductSelect}
                  resetState={resetState}
                  onQuantityChange={handleAllProductQuantityChange}
                />
              }
            />
            <Route
              path="/selected"
              element={
                <SelectedPage
                  selectedProducts={selectedProducts}
                  headers={headers}
                  onQuantityChange={handleQuantityChange}
                  onProductRemove={handleProductRemove}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;