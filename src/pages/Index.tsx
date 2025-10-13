import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, TrendingUp, Users, DollarSign, Table, Shirt } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalChairs: 0,
    availableChairs: 0,
    totalTables: 0,
    availableTables: 0,
    totalTablecloths: 0,
    availableTablecloths: 0,
    activeRentals: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load inventory totals
    const { data: inventory } = await supabase
      .from('inventory')
      .select('total_chairs, total_tables, total_tablecloths')
      .eq('user_id', user.id)
      .maybeSingle();

    // Calculate rented quantities from active rentals
    const { data: activeRentalsData } = await supabase
      .from('rentals')
      .select('chair_quantity, table_quantity, tablecloth_quantity')
      .eq('user_id', user.id)
      .eq('returned', false);

    const totalRentedChairs = activeRentalsData?.reduce((sum, rental) => sum + (rental.chair_quantity || 0), 0) || 0;
    const totalRentedTables = activeRentalsData?.reduce((sum, rental) => sum + (rental.table_quantity || 0), 0) || 0;
    const totalRentedTablecloths = activeRentalsData?.reduce((sum, rental) => sum + (rental.tablecloth_quantity || 0), 0) || 0;

    // Load active rentals count
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
      .gte('start_date', firstDayOfMonth.toISOString());

    const monthlyRevenue = rentals?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

    const totalChairs = inventory?.total_chairs || 0;
    const totalTables = inventory?.total_tables || 0;
    const totalTablecloths = inventory?.total_tablecloths || 0;

    setStats({
      totalChairs,
      availableChairs: totalChairs - totalRentedChairs,
      totalTables,
      availableTables: totalTables - totalRentedTables,
      totalTablecloths,
      availableTablecloths: totalTablecloths - totalRentedTablecloths,
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
            <p className="text-muted-foreground">Visão geral do seu negócio de aluguel de cadeiras, mesas e toalhas</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
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
                <CardTitle className="text-sm font-medium">Total de Mesas</CardTitle>
                <Table className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTables}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.availableTables} disponíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Toalhas</CardTitle>
                <Shirt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTablecloths}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.availableTablecloths} disponíveis
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Cadeiras</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalChairs > 0
                    ? Math.round(((stats.totalChairs - stats.availableChairs) / stats.totalChairs) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalChairs - stats.availableChairs} alugadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Mesas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalTables > 0
                    ? Math.round(((stats.totalTables - stats.availableTables) / stats.totalTables) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTables - stats.availableTables} alugadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Toalhas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalTablecloths > 0
                    ? Math.round(((stats.totalTablecloths - stats.availableTablecloths) / stats.totalTablecloths) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTablecloths - stats.availableTablecloths} alugadas
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/rentals/active')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aluguéis</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeRentals}</div>
                <p className="text-xs text-muted-foreground">Clique para gerenciar</p>
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
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Index;
