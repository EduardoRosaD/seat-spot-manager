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
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [rentalDate, setRentalDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create or get customer
    let customerId;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', customerEmail)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: customerName,
          email: customerEmail,
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

    // Create rental
    const { error: rentalError } = await supabase.from('rentals').insert({
      user_id: user.id,
      customer_id: customerId,
      rental_date: new Date(rentalDate).toISOString(),
      location_lat: parseFloat(locationLat),
      location_lng: parseFloat(locationLng),
      location_name: locationName,
      quantity: parseInt(quantity),
      amount: parseFloat(amount),
      returned: false,
    });

    if (rentalError) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar aluguel',
        description: rentalError.message,
      });
    } else {
      // Update inventory
      const { data: inventory } = await supabase
        .from('inventory')
        .select('available_chairs')
        .eq('user_id', user.id)
        .single();

      if (inventory) {
        await supabase
          .from('inventory')
          .update({
            available_chairs: inventory.available_chairs - parseInt(quantity),
          })
          .eq('user_id', user.id);
      }

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
            <p className="text-muted-foreground">Registre um novo aluguel de cadeiras</p>
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
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
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
                  <div className="space-y-2">
                    <Label htmlFor="rentalDate">Data do Aluguel</Label>
                    <Input
                      id="rentalDate"
                      type="datetime-local"
                      value={rentalDate}
                      onChange={(e) => setRentalDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade de Cadeiras</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="locationLat">Latitude</Label>
                      <Input
                        id="locationLat"
                        type="number"
                        step="any"
                        placeholder="-23.5505"
                        value={locationLat}
                        onChange={(e) => setLocationLat(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="locationLng">Longitude</Label>
                      <Input
                        id="locationLng"
                        type="number"
                        step="any"
                        placeholder="-46.6333"
                        value={locationLng}
                        onChange={(e) => setLocationLng(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nota: Em breve você poderá selecionar a localização diretamente no mapa
                  </p>
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
