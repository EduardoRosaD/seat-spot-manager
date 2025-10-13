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
  const [totalTables, setTotalTables] = useState('');
  const [totalTablecloths, setTotalTablecloths] = useState('');
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
      setTotalTables(data.total_tables?.toString() || '');
      setTotalTablecloths(data.total_tablecloths?.toString() || '');
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
      total_chairs: parseInt(totalChairs) || 0,
      total_tables: parseInt(totalTables) || 0,
      total_tablecloths: parseInt(totalTablecloths) || 0,
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
            <p className="text-muted-foreground">Gerencie o total de cadeiras, mesas e toalhas disponíveis</p>
          </div>

          <div className="grid gap-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Cadeiras</CardTitle>
                <CardDescription>
                  Defina o total de cadeiras no seu inventário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalChairs">Total de Cadeiras</Label>
                    <Input
                      id="totalChairs"
                      type="number"
                      min="0"
                      placeholder="100"
                      value={totalChairs}
                      onChange={(e) => setTotalChairs(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Controle de Mesas</CardTitle>
                <CardDescription>
                  Defina o total de mesas no seu inventário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalTables">Total de Mesas</Label>
                    <Input
                      id="totalTables"
                      type="number"
                      min="0"
                      placeholder="20"
                      value={totalTables}
                      onChange={(e) => setTotalTables(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Controle de Toalhas</CardTitle>
                <CardDescription>
                  Defina o total de toalhas no seu inventário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalTablecloths">Total de Toalhas</Label>
                    <Input
                      id="totalTablecloths"
                      type="number"
                      min="0"
                      placeholder="50"
                      value={totalTablecloths}
                      onChange={(e) => setTotalTablecloths(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} onClick={handleSave}>
                    {loading ? 'Salvando...' : 'Salvar Inventário'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Inventory;
