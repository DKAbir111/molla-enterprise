'use client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { useTheme } from '@/store/useTheme'

export function AppearanceSection() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Theme Preferences</CardTitle>
                    <CardDescription>Customize how your dashboard looks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {[
                            { id: 'default', name: 'Default', desc: 'Light theme with purple accents', colors: ['bg-purple-600', 'bg-blue-600', 'bg-gray-200'] },
                            { id: 'dark', name: 'Dark Mode', desc: 'Easy on the eyes', colors: ['bg-gray-900', 'bg-gray-800', 'bg-gray-700'] },
                            { id: 'contrast', name: 'High Contrast', desc: 'Enhanced visibility', colors: ['bg-black', 'bg-white', 'bg-yellow-400'] },
                        ].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTheme(t.id as any)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${theme === t.id
                                    ? 'border-purple-600 bg-purple-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-gray-900">{t.name}</h4>
                                    {theme === t.id && <Check className="h-5 w-5 text-purple-600" />}
                                </div>
                                <p className="text-sm text-gray-600 mb-4">{t.desc}</p>
                                <div className="flex gap-2">
                                    {t.colors.map((color, i) => (
                                        <div key={i} className={`h-8 w-8 rounded ${color} ${color === 'bg-white' ? 'border-2 border-gray-300' : ''}`}></div>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Invoice Preferences</CardTitle>
                    <CardDescription>Select template and defaults (coming soon)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        {['Classic', 'Compact', 'Modern'].map((tpl) => (
                            <label key={tpl} className="border rounded-lg p-3 flex items-center gap-2 cursor-not-allowed opacity-60">
                                <input type="radio" name="invTpl" disabled />
                                <span>{tpl}</span>
                            </label>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Invoice Prefix</label>
                            <Input placeholder="INV" disabled className="mt-1" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" disabled className="h-4 w-4" />
                            Show logo on invoice
                        </label>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
