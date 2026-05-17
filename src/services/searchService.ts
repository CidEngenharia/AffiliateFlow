import { supabase } from '../lib/supabase';
import type { Search } from '../types';

export const searchService = {
  async saveSearch(search: Omit<Search, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado no sistema.');

    const searchWithUser = {
      ...search,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from('searches')
      .insert([searchWithUser])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getHistory(limit: number = 10) {
    const { data, error } = await supabase
      .from('searches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async toggleFavorite(id: string, isFavorite: boolean) {
    const { error } = await supabase
      .from('searches')
      .update({ is_favorite: isFavorite })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteSearch(id: string) {
    const { error } = await supabase
      .from('searches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
