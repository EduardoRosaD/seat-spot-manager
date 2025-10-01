import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Table, Calendar, MapPin, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActiveRental {
  id: string;
  start_date: string | null;
  end_date: string | null;
  location_name: string | null;
  chair_quantity: number;
  table_quantity: number;
  amount: number;
  item_type: string;
  customers: {
    name: string;
    phone: string | null;
  };
}

const ActiveRentals = () => {
  const [rentals, setRentals] = useState<ActiveRental[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadActiveRentals = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('rentals')
      .select(`
        id,
        start_date,
        end_date,
        location_name,
        chair_quantity,
        table_quantity,
        amount,
        item_type,
        customers (
          name,
          phone
        )
      `)
      .eq('user_id', user.id)
      .eq('returned', false)
      .order('start_date', { ascending: true });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar aluguéis',
        description: error.message,
      });
    } else {
      setRentals(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadActiveRentals();
  }, [loadActiveRentals]);

  const handleMarkAsReturned = async (rentalId: string) => {
    const { error } = await supabase
      .from('rentals')
      .update({ returned: true })
      .eq('id', rentalId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao marcar como devolvido',
        description: error.message,
      });
    } else {
      toast({
        title: 'Aluguel finalizado!',
        description: 'O aluguel foi marcado como devolvido.',
      });
      loadActiveRentals(); // Reload the list
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'chair': return 'Cadeiras';
      case 'table': return 'Mesas';
      case 'mixed': return 'Misto';
      default: return type;
    }
  };

  const getItemTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'chair': return 'bg-blue-100 text-blue-800';
      case 'table': return 'bg-green-100 text-green-800';
      case 'mixed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Carregando aluguéis...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aluguéis Ativos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os aluguéis em andamento ({rentals.length} ativos)
            </p>
          </div>

          {rentals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum aluguel ativo</h3>
                <p className="text-muted-foreground text-center">
                  Todos os aluguéis foram finalizados ou não há aluguéis cadastrados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rentals.map((rental) => (
                <Card key={rental.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-lg">{rental.customers.name}</CardTitle>
                          {rental.customers.phone && (
                            <p className="text-sm text-muted-foreground">{rental.customers.phone}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={getItemTypeBadgeColor(rental.item_type)}>
                        {getItemTypeLabel(rental.item_type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {rental.chair_quantity > 0 && (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">
                            <strong>{rental.chair_quantity}</strong> cadeiras
                          </span>
                        </div>
                      )}
                      
                      {rental.table_quantity > 0 && (
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            <strong>{rental.table_quantity}</strong> mesas
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-semibold">
                          R$ {rental.amount.toFixed(2)}
                        </span>
                      </div>
                      
                      {rental.location_name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span className="text-sm">{rental.location_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                      {rental.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <span className="text-muted-foreground">Início: </span>
                            <span className="font-medium">
                              {format(new Date(rental.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {rental.end_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <span className="text-muted-foreground">Fim: </span>
                            <span className="font-medium">
                              {format(new Date(rental.end_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsReturned(rental.id)}
                        className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                      >
                        Marcar como Devolvido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ActiveRentals;
