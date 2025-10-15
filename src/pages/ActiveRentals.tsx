import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, Table, Calendar, MapPin, DollarSign, User, Filter, SortAsc, Square, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Rental {
  id: string;
  start_date: string | null;
  end_date: string | null;
  location_name: string | null;
  chair_quantity: number;
  table_quantity: number;
  tablecloth_quantity: number;
  tablecloth_color_id: string | null;
  amount: number;
  item_type: string;
  returned: boolean;
  created_at: string;
  notes: string | null;
  customers: {
    name: string;
    phone: string | null;
  };
  tablecloth_colors?: {
    id: string;
    name: string;
    hex_color: string;
  };
}

interface TableclothColor {
  id: string;
  name: string;
  hex_color: string;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [tableclothColors, setTableclothColors] = useState<TableclothColor[]>([]);
  const [editFormData, setEditFormData] = useState({
    chair_quantity: '',
    table_quantity: '',
    tablecloth_quantity: '',
    tablecloth_color_id: '',
    amount: '',
    location_name: '',
    start_date: '',
    end_date: '',
    notes: '',
  });
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
        tablecloth_quantity,
        tablecloth_color_id,
        amount,
        item_type,
        returned,
        created_at,
        notes,
        customers (
          name,
          phone
        ),
        tablecloth_colors (
          id,
          name,
          hex_color
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

  useEffect(() => {
    const fetchTableclothColors = async () => {
      const { data, error } = await supabase
        .from('tablecloth_colors')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching tablecloth colors:', error);
      } else {
        setTableclothColors(data || []);
      }
    };

    fetchTableclothColors();
  }, []);

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

  const handleEditRental = (rental: Rental) => {
    setSelectedRental(rental);
    setEditFormData({
      chair_quantity: rental.chair_quantity.toString(),
      table_quantity: rental.table_quantity.toString(),
      tablecloth_quantity: rental.tablecloth_quantity.toString(),
      tablecloth_color_id: rental.tablecloth_color_id || '',
      amount: rental.amount.toString(),
      location_name: rental.location_name || '',
      start_date: rental.start_date ? new Date(rental.start_date).toISOString().slice(0, 16) : '',
      end_date: rental.end_date ? new Date(rental.end_date).toISOString().slice(0, 16) : '',
      notes: rental.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteRental = (rental: Rental) => {
    setSelectedRental(rental);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRental) return;

    const { error } = await supabase
      .from('rentals')
      .delete()
      .eq('id', selectedRental.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir aluguel',
        description: error.message,
      });
    } else {
      toast({
        title: 'Aluguel excluído!',
        description: 'O aluguel foi removido com sucesso.',
      });
      loadActiveRentals();
    }
    setIsDeleteDialogOpen(false);
    setSelectedRental(null);
  };

  const saveEditedRental = async () => {
    if (!selectedRental) return;

    const chairQty = parseInt(editFormData.chair_quantity) || 0;
    const tableQty = parseInt(editFormData.table_quantity) || 0;
    const tableclothQty = parseInt(editFormData.tablecloth_quantity) || 0;

    if (chairQty === 0 && tableQty === 0 && tableclothQty === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'Selecione pelo menos uma cadeira, mesa ou toalha.',
      });
      return;
    }

    // Determine item type
    let itemType = '';
    const hasChairs = chairQty > 0;
    const hasTables = tableQty > 0;
    const hasTablecloths = tableclothQty > 0;

    if ((hasChairs && hasTables) || (hasChairs && hasTablecloths) || (hasTables && hasTablecloths) || (hasChairs && hasTables && hasTablecloths)) {
      itemType = 'mixed';
    } else if (hasChairs) {
      itemType = 'chair';
    } else if (hasTables) {
      itemType = 'table';
    } else if (hasTablecloths) {
      itemType = 'tablecloth';
    }

    const { error } = await supabase
      .from('rentals')
      .update({
        chair_quantity: chairQty,
        table_quantity: tableQty,
        tablecloth_quantity: tableclothQty,
        tablecloth_color_id: editFormData.tablecloth_color_id || null,
        quantity: chairQty + tableQty + tableclothQty,
        amount: parseFloat(editFormData.amount),
        location_name: editFormData.location_name || null,
        start_date: editFormData.start_date ? new Date(editFormData.start_date).toISOString() : null,
        end_date: editFormData.end_date ? new Date(editFormData.end_date).toISOString() : null,
        notes: editFormData.notes || null,
        item_type: itemType,
      })
      .eq('id', selectedRental.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar aluguel',
        description: error.message,
      });
    } else {
      toast({
        title: 'Aluguel atualizado!',
        description: 'As informações do aluguel foram atualizadas.',
      });
      loadActiveRentals();
      setIsEditDialogOpen(false);
    }
    setSelectedRental(null);
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'chair': return 'Cadeiras';
      case 'table': return 'Mesas';
      case 'tablecloth': return 'Toalhas';
      case 'mixed': return 'Misto';
      default: return type;
    }
  };

  const getItemTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'chair': return 'bg-blue-100 text-blue-800';
      case 'table': return 'bg-green-100 text-green-800';
      case 'tablecloth': return 'bg-pink-100 text-pink-800';
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
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gerenciar Aluguéis</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Visualize e gerencie todos os aluguéis ({totalRentals} total, {activeRentals} ativos, {inactiveRentals} finalizados)
            </p>
          </div>

          {/* Filtros e Controles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                Filtros e Ordenação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm">Buscar cliente</Label>
                  <Input
                    id="search"
                    placeholder="Nome do cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm">Status</Label>
                  <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
                    <SelectTrigger className="text-sm">
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
                  <Label htmlFor="sortBy" className="text-sm">Ordenar por</Label>
                  <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                    <SelectTrigger className="text-sm">
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
                  <Label htmlFor="sortOrder" className="text-sm">Ordem</Label>
                  <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
                    <SelectTrigger className="text-sm">
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
                  <CardHeader className="pb-3 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">{rental.customers.name}</CardTitle>
                          {rental.customers.phone && (
                            <p className="text-xs sm:text-sm text-muted-foreground">{rental.customers.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getItemTypeBadgeColor(rental.item_type)} text-xs`}>
                          {getItemTypeLabel(rental.item_type)}
                        </Badge>
                        <Badge variant={rental.returned ? "secondary" : "default"} className="text-xs">
                          {rental.returned ? "Finalizado" : "Ativo"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">
                          <strong>{rental.chair_quantity || 0}</strong> cadeiras
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Table className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">
                          <strong>{rental.table_quantity || 0}</strong> mesas
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm flex items-center gap-1">
                          <strong>{rental.tablecloth_quantity || 0}</strong> toalhas
                          {rental.tablecloth_quantity > 0 && rental.tablecloth_colors?.hex_color && (
                            <div
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-gray-300 ml-0.5 sm:ml-1 flex-shrink-0"
                              style={{ backgroundColor: rental.tablecloth_colors.hex_color }}
                              title={rental.tablecloth_colors.name}
                            />
                          )}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold">
                          R$ {rental.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {rental.location_name && (
                      <div className="flex items-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">{rental.location_name}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 sm:gap-3 pt-2 border-t">
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm">
                          <span className="text-muted-foreground">Criado em: </span>
                          <span className="font-medium">
                            {format(new Date(rental.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      
                      {rental.start_date && (
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="text-xs sm:text-sm">
                            <span className="text-muted-foreground">Início: </span>
                            <span className="font-medium">
                              {format(new Date(rental.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {rental.end_date && (
                        <div className="flex items-start gap-1.5 sm:gap-2">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <div>
                              <span className="text-muted-foreground">Fim: </span>
                              <span className="font-medium">
                                {format(new Date(rental.end_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            {(() => {
                              const endDate = new Date(rental.end_date);
                              const isOverdue = isPast(endDate) && !isToday(endDate);
                              const isDueToday = isToday(endDate);
                              
                              if (isOverdue && !rental.returned) {
                                return (
                                  <div className="flex items-center gap-1 text-red-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span className="text-[10px] sm:text-xs font-medium">ATRASADO</span>
                                  </div>
                                );
                              } else if (isDueToday && !rental.returned) {
                                return (
                                  <div className="flex items-center gap-1 text-orange-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span className="text-[10px] sm:text-xs font-medium">VENCE HOJE</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-end pt-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRental(rental)}
                        className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Editar</span>
                        <span className="sm:hidden">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRental(rental)}
                        className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Excluir</span>
                        <span className="sm:hidden">Excluir</span>
                      </Button>
                      {!rental.returned && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsReturned(rental.id)}
                          className="hover:bg-green-50 hover:text-green-700 hover:border-green-300 w-full sm:w-auto text-xs sm:text-sm"
                        >
                          Marcar como Devolvido
                        </Button>
                      )}
                    </div>

                    {rental.notes && (
                      <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-gray-50 rounded-md">
                        <div className="flex items-start gap-2">
                          <div className="text-xs sm:text-sm">
                            <span className="font-medium text-gray-700">Observações:</span>
                            <p className="text-gray-600 mt-1 break-words">{rental.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Rental Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Editar Aluguel</DialogTitle>
              <DialogDescription className="text-sm">
                Atualize as informações do aluguel de {selectedRental?.customers.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-chair-quantity" className="text-sm">Quantidade de Cadeiras</Label>
                  <Input
                    id="edit-chair-quantity"
                    type="number"
                    min="0"
                    value={editFormData.chair_quantity}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, chair_quantity: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-table-quantity" className="text-sm">Quantidade de Mesas</Label>
                  <Input
                    id="edit-table-quantity"
                    type="number"
                    min="0"
                    value={editFormData.table_quantity}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, table_quantity: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tablecloth-quantity" className="text-sm">Quantidade de Toalhas</Label>
                  <Input
                    id="edit-tablecloth-quantity"
                    type="number"
                    min="0"
                    value={editFormData.tablecloth_quantity}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, tablecloth_quantity: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              {parseInt(editFormData.tablecloth_quantity) > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="edit-tablecloth-color" className="text-sm">Cor das Toalhas</Label>
                  <Select 
                    value={editFormData.tablecloth_color_id} 
                    onValueChange={(value) => setEditFormData({ ...editFormData, tablecloth_color_id: value })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecione uma cor">
                        {editFormData.tablecloth_color_id && (() => {
                          const selectedColor = tableclothColors.find(color => color.id === editFormData.tablecloth_color_id);
                          return selectedColor ? (
                            <div className="flex items-center gap-2">
                              {selectedColor.hex_color && (
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: selectedColor.hex_color }}
                                />
                              )}
                              <span>{selectedColor.name}</span>
                            </div>
                          ) : "Selecione uma cor";
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {tableclothColors.map((color) => (
                        <SelectItem key={color.id} value={color.id}>
                          <div className="flex items-center gap-2">
                            {color.hex_color && (
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.hex_color }}
                              />
                            )}
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-amount" className="text-sm">Valor Total (R$)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.amount}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, amount: e.target.value })
                  }
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location" className="text-sm">Localização</Label>
                <Input
                  id="edit-location"
                  value={editFormData.location_name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, location_name: e.target.value })
                  }
                  placeholder="Ex: Salão de festas"
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-date" className="text-sm">Data de Início</Label>
                  <Input
                    id="edit-start-date"
                    type="datetime-local"
                    value={editFormData.start_date}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, start_date: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end-date" className="text-sm">Data de Término</Label>
                  <Input
                    id="edit-end-date"
                    type="datetime-local"
                    value={editFormData.end_date}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, end_date: e.target.value })
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes" className="text-sm">Observações</Label>
                <Textarea
                  id="edit-notes"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  placeholder="Observações adicionais sobre o aluguel..."
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="w-full sm:w-auto text-sm"
              >
                Cancelar
              </Button>
              <Button onClick={saveEditedRental} className="w-full sm:w-auto text-sm">Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o aluguel de{' '}
                <strong>{selectedRental?.customers.name}</strong>? Esta ação não pode
                ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </ProtectedRoute>
  );
};

export default ActiveRentals;
