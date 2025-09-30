import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, TrendingUp, Users, DollarSign } from 'lucide-react';

const Index = () => {
  const [stats, setStats] = useState({
    totalChairs: 0,
    availableChairs: 0,
    activeRentals: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load inventory
    const { data: inventory } = await supabase
      .from('inventory')
      .select('total_chairs, available_chairs')
      .eq('user_id', user.id)
      .maybeSingle();

    // Load active rentals
    const { count: activeRentals } = await supabase
      .from('rentals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('returned', false);

    // Calculate monthly revenue
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { data: rentals } = await supabase
      .from('rentals')
      .select('amount')
      .eq('user_id', user.id)
      .gte('rental_date', firstDayOfMonth.toISOString());

    const monthlyRevenue = rentals?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

    setStats({
      totalChairs: inventory?.total_chairs || 0,
      availableChairs: inventory?.available_chairs || 0,
      activeRentals: activeRentals || 0,
      monthlyRevenue,
    });
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio de aluguel de cadeiras</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Cadeiras</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalChairs}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.availableChairs} disponíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aluguéis Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeRentals}</div>
                <p className="text-xs text-muted-foreground">Em andamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {stats.monthlyRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Mês atual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalChairs > 0
                    ? Math.round(((stats.totalChairs - stats.availableChairs) / stats.totalChairs) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Cadeiras alugadas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Index;
