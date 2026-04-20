export function getContrastText(bgColorClass: string): string {
    // Classes claras que precisam de texto escuro para contraste (WCAG)
    const lightBackgrounds = [
        'bg-status-pendente',
        'bg-status-hold',
        'bg-yellow-400',
        'bg-amber-400',
        'bg-orange-500',
        'bg-white',
        'bg-gray-50',
        'bg-gray-100',
        'bg-gray-200',
        'bg-slate-50',
        'bg-slate-100',
        'bg-slate-200'
    ];

    return lightBackgrounds.some(bg => bgColorClass.includes(bg))
        ? 'text-slate-900'
        : 'text-white';
}

// Utilitário para lidar com Enter e Space keys (A11y)
export function handleKeyDown(e: React.KeyboardEvent, callback: () => void) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback();
    }
}
