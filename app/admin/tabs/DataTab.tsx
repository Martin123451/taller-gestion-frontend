import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useApp } from '../../../contexts/AppContext';
import { WorkOrder } from '../../../lib/types';
import { Download } from 'lucide-react';

const dateFromInput = (dateString: string): Date => {
    if (!dateString) return new Date();
    return new Date(dateString + 'T12:00:00');
};

/**
 * Safely converts a potential Firestore Timestamp or Date object into a JavaScript Date.
 * @param date - The date value to convert.
 * @returns A Date object or null if the input is invalid.
 */
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

    const filterWorkOrders = () => {
        if (!startDate || !endDate) {
            setFilteredWorkOrders([]);
            return;
        }

        const start = dateFromInput(startDate);
        const end = dateFromInput(endDate);
        end.setHours(23, 59, 59, 999);

        const delivered = state.workOrders
            .filter(wo => {
                if (wo.status !== 'completed' || !wo.deliveredAt) return false;
                const deliveryDate = toSafeDate(wo.deliveredAt);
                return deliveryDate && deliveryDate >= start && deliveryDate <= end;
            })
            .sort((a, b) => {
                // At this point, deliveredAt is guaranteed to be valid by the filter above.
                const dateA = toSafeDate(a.deliveredAt)!;
                const dateB = toSafeDate(b.deliveredAt)!;
                return dateB.getTime() - dateA.getTime();
            });
        
        setFilteredWorkOrders(delivered);
    };

    const calculateProfit = (workOrder: WorkOrder) => {
        const totalCost = workOrder.parts.reduce((sum, partItem) => {
            const fullPart = state.parts.find(p => p.id === partItem.partId);
            return sum + (fullPart?.costPrice || 0) * partItem.quantity;
        }, 0);
        return workOrder.totalAmount - totalCost;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Análisis y Reportes</CardTitle>
                    <CardDescription>Filtra y exporta el historial de fichas de trabajo entregadas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="start-date">Fecha de Inicio</Label>
                            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="end-date">Fecha de Fin</Label>
                            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <Button className="self-end" onClick={filterWorkOrders}>Filtrar</Button>
                    </div>
                </CardContent>
            </Card>

            {filteredWorkOrders.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados</CardTitle>
                        <CardDescription>{filteredWorkOrders.length} fichas encontradas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};