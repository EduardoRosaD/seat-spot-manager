import { useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const NewRental = () => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [chairQuantity, setChairQuantity] = useState('');
  const [tableQuantity, setTableQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [locationName, setLocationName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const chairQty = parseInt(chairQuantity) || 0;
    const tableQty = parseInt(tableQuantity) || 0;

    // Validate that at least one item is selected
    if (chairQty === 0 && tableQty === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'Selecione pelo menos uma cadeira ou mesa para o aluguel.',
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
    if (chairQty > 0 && tableQty > 0) {
      itemType = 'mixed';
    } else if (chairQty > 0) {
      itemType = 'chair';
    } else {
      itemType = 'table';
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
      quantity: chairQty + tableQty, // Total quantity
      chair_quantity: chairQty,
      table_quantity: tableQty,
      amount: parseFloat(amount),
      item_type: itemType,
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
            <p className="text-muted-foreground">Registre um novo aluguel de cadeiras e/ou mesas</p>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                  
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
