import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Table, Calendar, MapPin, DollarSign, User, Filter, SortAsc } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Rental {
  id: string;
  start_date: string | null;
  end_date: string | null;
  location_name: string | null;
  chair_quantity: number;
  table_quantity: number;
  amount: number;
  item_type: string;
  returned: boolean;
  created_at: string;
  customers: {
    name: string;
    phone: string | null;
  };
}

type FilterStatus = 'all' | 'active' | 'inactive';
type SortBy = 'date' | 'price' | 'customer';
type SortOrder = 'asc' | 'desc';

const ActiveRentals = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
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
        returned,
        created_at,
        customers (
          name,
          phone
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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

  // Função para filtrar e ordenar os aluguéis
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...rentals];

    // Aplicar filtro de status
    if (filterStatus === 'active') {
      filtered = filtered.filter(rental => !rental.returned);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(rental => rental.returned);
    }

    // Aplicar busca por nome do cliente
    if (searchTerm) {
      filtered = filtered.filter(rental =>
        rental.customers.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'price':
          comparison = a.amount - b.amount;
          break;
        case 'customer':
          comparison = a.customers.name.localeCompare(b.customers.name);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredRentals(filtered);
  }, [rentals, filterStatus, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

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

  const handleMarkAsActive = async (rentalId: string) => {
    const { error } = await supabase
      .from('rentals')
      .update({ returned: false })
      .eq('id', rentalId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao marcar como ativo',
        description: error.message,
      });
    } else {
      toast({
        title: 'Aluguel reativado!',
        description: 'O aluguel foi marcado como ativo.',
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

  const totalRentals = filteredRentals.length;
  const activeRentals = filteredRentals.filter(r => !r.returned).length;
  const inactiveRentals = filteredRentals.filter(r => r.returned).length;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Aluguéis</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todos os aluguéis ({totalRentals} total, {activeRentals} ativos, {inactiveRentals} finalizados)
            </p>
          </div>

          {/* Filtros e Controles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros e Ordenação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar cliente</Label>
                  <Input
                    id="search"
                    placeholder="Nome do cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Finalizados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortBy">Ordenar por</Label>
                  <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Data</SelectItem>
                      <SelectItem value="price">Preço</SelectItem>
                      <SelectItem value="customer">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Ordem</Label>
                  <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">
                        <div className="flex items-center gap-2">
                          <SortAsc className="h-4 w-4 rotate-180" />
                          Decrescente
                        </div>
                      </SelectItem>
                      <SelectItem value="asc">
                        <div className="flex items-center gap-2">
                          <SortAsc className="h-4 w-4" />
                          Crescente
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredRentals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum aluguel encontrado</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Tente ajustar os filtros para encontrar aluguéis.' 
                    : 'Não há aluguéis cadastrados.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRentals.map((rental) => (
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
                      <div className="flex items-center gap-2">
                        <Badge className={getItemTypeBadgeColor(rental.item_type)}>
                          {getItemTypeLabel(rental.item_type)}
                        </Badge>
                        <Badge variant={rental.returned ? "secondary" : "default"}>
                          {rental.returned ? "Finalizado" : "Ativo"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          <strong>{rental.chair_quantity}</strong> cadeiras
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4 text-green-600" />
                        <span className="text-sm">
                          <strong>{rental.table_quantity}</strong> mesas
                        </span>
                      </div>
                      
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
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <span className="text-muted-foreground">Criado em: </span>
                          <span className="font-medium">
                            {format(new Date(rental.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      
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

                    <div className="flex justify-end pt-2 gap-2">
                      {!rental.returned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsReturned(rental.id)}
                          className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                        >
                          Marcar como Devolvido
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsActive(rental.id)}
                          className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                        >
                          Reativar Aluguel
                        </Button>
                      )}
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
