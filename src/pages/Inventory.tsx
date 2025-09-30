import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Inventory = () => {
  const [totalChairs, setTotalChairs] = useState('');
  const [availableChairs, setAvailableChairs] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasInventory, setHasInventory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setTotalChairs(data.total_chairs.toString());
      setAvailableChairs(data.available_chairs.toString());
      setHasInventory(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const inventoryData = {
      user_id: user.id,
      total_chairs: parseInt(totalChairs),
      available_chairs: parseInt(availableChairs),
      updated_at: new Date().toISOString(),
    };

    let error;
    if (hasInventory) {
      ({ error } = await supabase
        .from('inventory')
        .update(inventoryData)
        .eq('user_id', user.id));
    } else {
      ({ error } = await supabase.from('inventory').insert(inventoryData));
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    } else {
      toast({
        title: 'Inventário salvo!',
        description: 'Suas informações foram atualizadas.',
      });
      setHasInventory(true);
    }
    setLoading(false);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventário</h1>
            <p className="text-muted-foreground">Gerencie o total de cadeiras disponíveis</p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Controle de Cadeiras</CardTitle>
              <CardDescription>
                Atualize a quantidade total e disponível de cadeiras no seu inventário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="total">Total de Cadeiras</Label>
                  <Input
                    id="total"
                    type="number"
                    min="0"
                    placeholder="100"
                    value={totalChairs}
                    onChange={(e) => setTotalChairs(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available">Cadeiras Disponíveis</Label>
                  <Input
                    id="available"
                    type="number"
                    min="0"
                    placeholder="75"
                    value={availableChairs}
                    onChange={(e) => setAvailableChairs(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Inventário'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Inventory;
