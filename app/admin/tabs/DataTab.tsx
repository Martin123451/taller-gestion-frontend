import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useApp } from '../../../contexts/AppContext';
import { WorkOrder } from '../../../lib/types';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const toSafeDate = (date: any): Date | null => {
    if (!date) return null;
    if (typeof date.toDate === 'function') return date.toDate();
    if (date instanceof Date) return date;
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const DataTab = () => {
    const { state } = useApp();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
    const [activeChip, setActiveChip] = useState<string | null>(null);

    const handleSetDateRange = (range: 'today' | 'thisMonth' | 'lastMonth') => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        setActiveChip(range);

        if (range === 'today') {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (range === 'thisMonth') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (range === 'lastMonth') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        }

        setStartDate(formatDateForInput(start));
        setEndDate(formatDateForInput(end));
    };
    
    useEffect(() => {
        const filterWorkOrders = () => {
            if (!startDate || !endDate) {
                setFilteredWorkOrders([]);
                return;
            }

            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');

            const delivered = state.workOrders
                .filter(wo => {
                    if (wo.status !== 'completed' || !wo.deliveredAt) return false;
                    const deliveryDate = toSafeDate(wo.deliveredAt);
                    return deliveryDate && deliveryDate >= start && deliveryDate <= end;
                })
                .sort((a, b) => {
                    const dateA = toSafeDate(a.deliveredAt)!;
                    const dateB = toSafeDate(b.deliveredAt)!;
                    return dateB.getTime() - dateA.getTime();
                });
            
            setFilteredWorkOrders(delivered);
        };
        
        filterWorkOrders();
    }, [startDate, endDate, state.workOrders]);

    const calculateProfit = (workOrder: WorkOrder) => {
        const totalCost = workOrder.parts.reduce((sum, partItem) => {
            const fullPart = state.parts.find(p => p.id === partItem.partId);
            const costPrice = fullPart?.costPrice || 0;
            return sum + (costPrice * partItem.quantity);
        }, 0);
        return workOrder.totalAmount - totalCost;
    };

    const chartData = useMemo(() => {
        const totalRevenue = filteredWorkOrders.reduce((sum, wo) => sum + wo.totalAmount, 0);
        const totalProfit = filteredWorkOrders.reduce((sum, wo) => sum + calculateProfit(wo), 0);
        
        const servicesCount = filteredWorkOrders
            .flatMap(wo => wo.services)
            .reduce((acc, service) => {
                const name = service.service?.name || 'Desconocido';
                acc[name] = (acc[name] || 0) + service.quantity;
                return acc;
            }, {} as Record<string, number>);

        return {
            summary: [
                { name: 'Ingresos', value: totalRevenue },
                { name: 'Ganancia', value: totalProfit },
            ],
            services: servicesCount,
        };
    }, [filteredWorkOrders]);

    const exportToExcel = () => {
        if (filteredWorkOrders.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        const excelData = filteredWorkOrders.map(workOrder => {
            const clientName = workOrder.client?.name || 'N/A';
            const bicycleInfo = workOrder.bicycle ? `${workOrder.bicycle.brand} ${workOrder.bicycle.model}` : 'N/A';
            const mechanic = state.users.find(u => u.id === workOrder.mechanicId);
            const mechanicName = mechanic?.name || 'No asignado';
            
            const servicesStr = workOrder.services.map(s => `${s.service?.name}(x${s.quantity})`).join('; ') || 'Ninguno';
            const partsStr = workOrder.parts.map(p => `${p.part?.name}(x${p.quantity})`).join('; ') || 'Ninguna';

            const timeDiff = toSafeDate(workOrder.completedAt) && toSafeDate(workOrder.startedAt)
                ? (toSafeDate(workOrder.completedAt)!.getTime() - toSafeDate(workOrder.startedAt)!.getTime()) / (1000 * 60 * 60 * 24)
                : 0;
            
            return {
                'ID Ficha': workOrder.id,
                'Fecha Entrega': toSafeDate(workOrder.deliveredAt)?.toLocaleDateString(),
                'Cliente': clientName,
                'Bicicleta': bicycleInfo,
                'Mecánico': mechanicName,
                'Servicios': servicesStr,
                'Piezas': partsStr,
                'Tiempo Trabajo (días)': timeDiff.toFixed(2),
                'Total Facturado': workOrder.totalAmount,
                'Utilidad Estimada': calculateProfit(workOrder),
            };
        });

        const headers = Object.keys(excelData[0]).join(',');
        const csvContent = [
            headers,
            ...excelData.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_fichas_${startDate}_a_${endDate}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const pieChartData = Object.entries(chartData.services).map(([name, value]) => ({ name, value }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Análisis y Reportes</CardTitle>
                    <CardDescription>Selecciona un rango de fechas para ver el historial y las métricas de fichas completadas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start-date">Fecha de Inicio</Label>
                            <Input id="start-date" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setActiveChip(null); }} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end-date">Fecha de Fin</Label>
                            <Input id="end-date" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setActiveChip(null); }} />
                        </div>
                        <div className="flex items-center gap-2 border-l pl-4">
                            <Button size="sm" variant={activeChip === 'today' ? 'default' : 'outline'} onClick={() => handleSetDateRange('today')}>Hoy</Button>
                            <Button size="sm" variant={activeChip === 'thisMonth' ? 'default' : 'outline'} onClick={() => handleSetDateRange('thisMonth')}>Este Mes</Button>
                            <Button size="sm" variant={activeChip === 'lastMonth' ? 'default' : 'outline'} onClick={() => handleSetDateRange('lastMonth')}>Mes Pasado</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {startDate && endDate && filteredWorkOrders.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>Resumen Financiero</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData.summary} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={(value) => `$${(value/1000)}k`} />
                                        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                        <Bar dataKey="value" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Servicios Más Realizados</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                            {pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                        </Pie>
                                        <Tooltip formatter={(value: number, name: string) => [`${value} ${name}`, 'Cantidad']}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Historial Detallado</CardTitle>
                                <CardDescription>{filteredWorkOrders.length} fichas encontradas.</CardDescription>
                            </div>
                            <Button variant="outline" onClick={exportToExcel}>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar Reporte
                            </Button>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Entrega</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Mecánico</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Utilidad</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWorkOrders.map(workOrder => (
                                        <TableRow key={workOrder.id}>
                                            <TableCell>{toSafeDate(workOrder.deliveredAt)?.toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{workOrder.client?.name || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">{workOrder.bicycle ? `${workOrder.bicycle.brand} ${workOrder.bicycle.model}` : 'N/A'}</div>
                                            </TableCell>
                                            <TableCell>{state.users.find(u => u.id === workOrder.mechanicId)?.name || 'No asignado'}</TableCell>
                                            <TableCell className="text-xs">
                                                <div>{workOrder.services.map(s => s.service?.name).join(', ')}</div>
                                                <div className="text-muted-foreground">{workOrder.parts.map(p => p.part?.name).join(', ')}</div>
                                            </TableCell>
                                            <TableCell className="text-right">${workOrder.totalAmount.toLocaleString()}</TableCell>
                                            <TableCell className={`text-right font-semibold ${calculateProfit(workOrder) >= 0 ? 'text-green-600' : 'text-red-600'}`}>${calculateProfit(workOrder).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                 <Card>
                    <CardContent>
                        <p className="text-center text-muted-foreground py-8">{startDate && endDate ? "No se encontraron fichas en el rango seleccionado." : "Selecciona un rango de fechas para ver los datos."}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};