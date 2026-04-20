"use client";

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    PencilRuler,
    PackageSearch,
    Factory,
    ShieldCheck,
    LogOut,
    UploadCloud
} from 'lucide-react';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Importar (Bulk)', href: '/importacao', icon: UploadCloud },
        { name: 'Engenharia', href: '/engenharia', icon: PencilRuler },
        { name: 'Armazém', href: '/armazem', icon: PackageSearch },
        { name: 'Produção', href: '/producao', icon: Factory },
        { name: 'Qualidade (NDT)', href: '/qualidade', icon: ShieldCheck },
    ];

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('perfil');
            window.location.href = '/login';
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-foreground">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="h-16 flex items-center justify-center border-b border-slate-800">
                    <h1 className="text-xl font-bold tracking-wider text-status-pendente">TRACK-FAB ERP</h1>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            // Check if current route starts with href (to cover subroutes)
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                                            isActive
                                                ? 'bg-slate-800 text-white shadow-inner border-l-4 border-status-pendente'
                                                : 'hover:bg-slate-800 text-slate-300 hover:text-white border-l-4 border-transparent'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                        <LogOut className="w-5 h-5 text-status-erro" />
                        <span className="font-medium">Terminar Sessão</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">Operações</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            Perfil: ADMIN
                        </span>
                        <div className="w-8 h-8 rounded-full bg-status-corte flex items-center justify-center text-white font-bold">
                            U
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
