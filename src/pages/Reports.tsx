import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, startOfMonth, startOfYear } from 'date-fns';

const Reports = () => {
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [yearlyRevenue, setYearlyRevenue] = useState(0);
  const [topCustomer, setTopCustomer] = useState<{ name: string; count: number } | null>(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<{ month: string; revenue: number }[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    // Weekly revenue
    const { data: weeklyData } = await supabase
      .from('rentals')
      .select('amount')
      .eq('user_id', user.id)
      .gte('start_date', weekStart.toISOString());
    
    setWeeklyRevenue(weeklyData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0);

    // Monthly revenue
    const { data: monthlyData } = await supabase
      .from('rentals')
      .select('amount')
      .eq('user_id', user.id)
      .gte('start_date', monthStart.toISOString());
    
    setMonthlyRevenue(monthlyData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0);

    // Yearly revenue
    const { data: yearlyData } = await supabase
      .from('rentals')
      .select('amount')
      .eq('user_id', user.id)
      .gte('start_date', yearStart.toISOString());
    
    setYearlyRevenue(yearlyData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0);

    // Top customer
    const { data: rentalsWithCustomers } = await supabase
      .from('rentals')
      .select('customer_id, customers(name)')
      .eq('user_id', user.id);

    if (rentalsWithCustomers) {
      const customerCounts = rentalsWithCustomers.reduce((acc: Record<string, { name: string; count: number }>, rental: { customer_id: string; customers: { name: string } | null }) => {
        const customerId = rental.customer_id;
        const customerName = rental.customers?.name || 'Desconhecido';
        if (!acc[customerId]) {
          acc[customerId] = { name: customerName, count: 0 };
        }
        acc[customerId].count++;
        return acc;
      }, {});

      const topCustomerData = Object.values(customerCounts).sort((a: { name: string; count: number }, b: { name: string; count: number }) => b.count - a.count)[0];
      setTopCustomer(topCustomerData || null);
    }

    // Monthly breakdown for the current year
    const { data: allRentals } = await supabase
      .from('rentals')
      .select('amount, start_date')
      .eq('user_id', user.id)
      .gte('start_date', yearStart.toISOString())
      .order('start_date');

    if (allRentals) {
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];

      const monthlyData: Record<number, number> = {};
      
      allRentals.forEach((rental: { amount: number; start_date: string }) => {
        const date = new Date(rental.start_date);
        const month = date.getMonth();
        monthlyData[month] = (monthlyData[month] || 0) + Number(rental.amount);
      });

      const breakdown = monthNames.map((name, index) => ({
        month: name,
        revenue: monthlyData[index] || 0
      }));

      setMonthlyBreakdown(breakdown);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">Análise financeira e estatísticas de clientes</p>
          </div>

          <Tabs defaultValue="financial" className="space-y-4">
            <TabsList>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="monthly">Mês a Mês</TabsTrigger>
              <TabsTrigger value="customers">Clientes</TabsTrigger>
            </TabsList>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Receita Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      R$ {weeklyRevenue.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Receita Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-secondary">
                      R$ {monthlyRevenue.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Este mês</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Receita Anual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-accent">
                      R$ {yearlyRevenue.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Este ano</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monthly">
              <Card>
                <CardHeader>
                  <CardTitle>Receita Mês a Mês (Ano Atual)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium">{item.month}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-48 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ 
                                width: `${monthlyBreakdown.length > 0 ? (item.revenue / Math.max(...monthlyBreakdown.map(m => m.revenue)) * 100) : 0}%` 
                              }}
                            />
                          </div>
                          <p className="text-lg font-bold min-w-[120px] text-right">
                            R$ {item.revenue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {monthlyBreakdown.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum dado disponível
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle>Cliente Mais Frequente</CardTitle>
                </CardHeader>
                <CardContent>
                  {topCustomer ? (
                    <div>
                      <p className="text-2xl font-bold">{topCustomer.name}</p>
                      <p className="text-muted-foreground">
                        {topCustomer.count} aluguéis realizados
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhum aluguel registrado ainda</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Reports;
