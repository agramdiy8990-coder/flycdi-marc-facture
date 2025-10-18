import React from 'react';
import { NavLink } from 'react-router-dom';

interface HeaderProps {
    selectedCount: number;
}

const Header: React.FC<HeaderProps> = ({ selectedCount }) => {
    const activeLinkClass = "bg-sky-100 text-sky-700";
    const defaultLinkClass = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

    return (
        <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
                    <div className="flex items-center space-x-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h1 className="text-xl font-bold text-gray-900">Sélecteur de Produits</h1>
                    </div>
                    <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                        <NavLink 
                            to="/" 
                            className={({ isActive }) => `${isActive ? activeLinkClass : defaultLinkClass} px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                        >
                            Tous les produits
                        </NavLink>
                        <NavLink 
                            to="/selected" 
                            className={({ isActive }) => `${isActive ? activeLinkClass : defaultLinkClass} relative px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200`}
                        >
                            Produits Sélectionnés
                            {selectedCount > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-xs font-medium text-white">
                                    {selectedCount}
                                </span>
                            )}
                        </NavLink>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;