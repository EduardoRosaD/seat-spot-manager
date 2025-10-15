import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Pencil, Trash2, Plus, Search } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  rental_count?: number;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const { toast } = useToast();

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('customers')
      .select('*, rentals(count)')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar clientes',
        description: error.message,
      });
    } else {
      // Transform the data to include rental count
      const customersWithCount = (data || []).map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        created_at: customer.created_at,
        rental_count: customer.rentals?.[0]?.count || 0,
      }));
      setCustomers(customersWithCount);
      setFilteredCustomers(customersWithCount);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  const handleAddCustomer = () => {
    setFormData({ name: '', email: '', phone: '' });
    setIsAddDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', selectedCustomer.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir cliente',
        description: error.message,
      });
    } else {
      toast({
        title: 'Cliente excluído!',
        description: 'O cliente foi removido com sucesso.',
      });
      loadCustomers();
    }
    setIsDeleteDialogOpen(false);
    setSelectedCustomer(null);
  };

  const saveCustomer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do cliente.',
      });
      return;
    }

    if (selectedCustomer) {
      // Update existing customer
      const { error } = await supabase
        .from('customers')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
        })
        .eq('id', selectedCustomer.id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao atualizar cliente',
          description: error.message,
        });
      } else {
        toast({
          title: 'Cliente atualizado!',
          description: 'As informações do cliente foram atualizadas.',
        });
        loadCustomers();
        setIsEditDialogOpen(false);
      }
    } else {
      // Create new customer
      const { error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
        });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar cliente',
          description: error.message,
        });
      } else {
        toast({
          title: 'Cliente criado!',
          description: 'O novo cliente foi adicionado com sucesso.',
        });
        loadCustomers();
        setIsAddDialogOpen(false);
      }
    }
    setSelectedCustomer(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clientes</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Gerencie seus clientes</p>
            </div>
            <Button onClick={handleAddCustomer} className="w-full sm:w-auto text-sm flex-shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
          </div>

          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Lista de Clientes</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} cadastrado{filteredCustomers.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 w-full">
                  <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-sm min-w-0"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Carregando...
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {searchTerm
                      ? 'Nenhum cliente encontrado com esse termo de busca.'
                      : 'Nenhum cliente cadastrado ainda.'}
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-md overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Nome</TableHead>
                            <TableHead className="whitespace-nowrap">Email</TableHead>
                            <TableHead className="whitespace-nowrap">Telefone</TableHead>
                            <TableHead className="whitespace-nowrap">Aluguéis</TableHead>
                            <TableHead className="whitespace-nowrap">Data de Cadastro</TableHead>
                            <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCustomers.map((customer) => (
                            <TableRow key={customer.id}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {customer.name}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {customer.email || <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {customer.phone || <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 whitespace-nowrap">
                                  {customer.rental_count || 0}
                                </span>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{formatDate(customer.created_at)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditCustomer(customer)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteCustomer(customer)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3 w-full">
                      {filteredCustomers.map((customer) => (
                        <Card key={customer.id} className="hover:shadow-md transition-shadow w-full">
                          <CardContent className="p-3 sm:p-4">
                            <div className="space-y-2.5 sm:space-y-3 w-full">
                              {/* Header with name and actions */}
                              <div className="flex items-start justify-between gap-2 w-full">
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <h3 className="font-semibold text-sm sm:text-base truncate">
                                    {customer.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 whitespace-nowrap">
                                      {customer.rental_count || 0} {customer.rental_count === 1 ? 'aluguel' : 'aluguéis'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditCustomer(customer)}
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  >
                                    <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteCustomer(customer)}
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              {/* Contact info */}
                              <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm w-full overflow-hidden">
                                {customer.email && (
                                  <div className="flex items-start gap-2 min-w-0">
                                    <span className="text-muted-foreground flex-shrink-0 w-[55px] sm:w-[60px]">Email:</span>
                                    <span className="break-all min-w-0 flex-1">{customer.email}</span>
                                  </div>
                                )}
                                {customer.phone && (
                                  <div className="flex items-start gap-2 min-w-0">
                                    <span className="text-muted-foreground flex-shrink-0 w-[55px] sm:w-[60px]">Telefone:</span>
                                    <span className="truncate">{customer.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-start gap-2 min-w-0">
                                  <span className="text-muted-foreground flex-shrink-0 w-[55px] sm:w-[60px]">Cadastro:</span>
                                  <span className="truncate">{formatDate(customer.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Customer Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-[425px] mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Adicionar Cliente</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Preencha os dados do novo cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name" className="text-xs sm:text-sm">Nome *</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome completo"
                  className="text-sm w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                  className="text-sm w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone" className="text-xs sm:text-sm">Telefone</Label>
                <Input
                  id="add-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                  className="text-sm w-full"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Cancelar
              </Button>
              <Button onClick={saveCustomer} className="w-full sm:w-auto text-xs sm:text-sm">Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-[425px] mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Editar Cliente</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Atualize os dados do cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-xs sm:text-sm">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome completo"
                  className="text-sm w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                  className="text-sm w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-xs sm:text-sm">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                  className="text-sm w-full"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Cancelar
              </Button>
              <Button onClick={saveCustomer} className="w-full sm:w-auto text-xs sm:text-sm">Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-[425px] mx-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                Tem certeza que deseja excluir o cliente{' '}
                <strong>{selectedCustomer?.name}</strong>? Esta ação não pode
                ser desfeita e todos os aluguéis associados a este cliente
                também serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto text-xs sm:text-sm m-0">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto text-xs sm:text-sm"
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

export default Customers;
