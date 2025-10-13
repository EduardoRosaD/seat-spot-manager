import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface TableclothColor {
  id: string;
  name: string;
  hex_color?: string;
}

const NewRental = () => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [chairQuantity, setChairQuantity] = useState('');
  const [tableQuantity, setTableQuantity] = useState('');
  const [tableclothQuantity, setTableclothQuantity] = useState('');
  const [selectedTableclothColor, setSelectedTableclothColor] = useState('');
  const [tableclothColors, setTableclothColors] = useState<TableclothColor[]>([]);
  const [amount, setAmount] = useState('');
  const [locationName, setLocationName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch tablecloth colors on component mount
  useEffect(() => {
    const fetchTableclothColors = async () => {
      const { data, error } = await supabase
        .from('tablecloth_colors')
        .select('*') // Vamos buscar todas as colunas primeiro para ver o que existe
        .order('name');

      if (error) {
        console.error('Error fetching tablecloth colors:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Não foi possível carregar as cores das toalhas.',
        });
      } else {
        console.log('Tablecloth colors data:', data); // Debug
        setTableclothColors(data || []);
      }
    };

    fetchTableclothColors();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const chairQty = parseInt(chairQuantity) || 0;
    const tableQty = parseInt(tableQuantity) || 0;
    const tableclothQty = parseInt(tableclothQuantity) || 0;

    // Validate that at least one item is selected
    if (chairQty === 0 && tableQty === 0 && tableclothQty === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'Selecione pelo menos uma cadeira, mesa ou toalha para o aluguel.',
      });
      setLoading(false);
      return;
    }

    // Validate tablecloth color if tablecloth quantity is selected
    if (tableclothQty > 0 && !selectedTableclothColor) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'Selecione uma cor para as toalhas.',
      });
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create or get customer
    let customerId;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', customerName)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: customerName,
          phone: customerPhone,
        })
        .select()
        .single();

      if (customerError) {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar cliente',
          description: customerError.message,
        });
        setLoading(false);
        return;
      }
      customerId = newCustomer.id;
    }

    // Determine item type based on selected items
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

    // Create single rental
    const { error: rentalError } = await supabase.from('rentals').insert({
      user_id: user.id,
      customer_id: customerId,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      location_lat: 0,
      location_lng: 0,
      location_name: locationName,
      quantity: chairQty + tableQty + tableclothQty,
      chair_quantity: chairQty,
      table_quantity: tableQty,
      tablecloth_quantity: tableclothQty,
      tablecloth_color_id: selectedTableclothColor || null,
      amount: parseFloat(amount),
      item_type: itemType,
      notes: notes || null,
      returned: false,
    });

    if (rentalError) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar aluguel',
        description: rentalError.message,
      });
    } else {
      toast({
        title: 'Aluguel criado!',
        description: 'O aluguel foi registrado com sucesso.',
      });
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Aluguel</h1>
            <p className="text-muted-foreground">Registre um novo aluguel de cadeiras, mesas e/ou toalhas</p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Dados do Aluguel</CardTitle>
              <CardDescription>Preencha as informações do cliente e do aluguel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Cliente</h3>
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nome</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Telefone</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Detalhes do Aluguel</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data de Entrada</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data de Saída</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="chairQuantity">Quantidade de Cadeiras</Label>
                      <Input
                        id="chairQuantity"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={chairQuantity}
                        onChange={(e) => setChairQuantity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tableQuantity">Quantidade de Mesas</Label>
                      <Input
                        id="tableQuantity"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={tableQuantity}
                        onChange={(e) => setTableQuantity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tableclothQuantity">Quantidade de Toalhas</Label>
                      <Input
                        id="tableclothQuantity"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={tableclothQuantity}
                        onChange={(e) => setTableclothQuantity(e.target.value)}
                      />
                    </div>
                  </div>

                  {parseInt(tableclothQuantity) > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="tableclothColor">Cor das Toalhas</Label>
                      <Select value={selectedTableclothColor} onValueChange={setSelectedTableclothColor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma cor">
                            {selectedTableclothColor && (() => {
                              const selectedColor = tableclothColors.find(color => color.id.toString() === selectedTableclothColor);
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
                            <SelectItem key={color.id} value={color.id.toString()}>
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
                    <Label htmlFor="amount">Valor Total (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Localização</h3>
                  <div className="space-y-2">
                    <Label htmlFor="locationName">Nome do Local</Label>
                    <Input
                      id="locationName"
                      placeholder="Ex: Salão de Festas Centro"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <textarea
                      id="notes"
                      placeholder="Digite observações sobre o aluguel (opcional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      rows={3}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Salvando...' : 'Criar Aluguel'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default NewRental;
