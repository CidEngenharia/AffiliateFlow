import { supabase } from '../lib/supabase';
import type { Link, Category } from '../types';

export const linkService = {
  async getAll() {
    const { data, error } = await supabase
      .from('links')
      .select('*, categories(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(link: Partial<Link>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado no sistema.');

    const cleanLink = { 
      ...link,
      user_id: user.id
    };
    if (cleanLink.category_id === '') {
      cleanLink.category_id = null;
    }
    const { data, error } = await supabase
      .from('links')
      .insert([cleanLink])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Link>) {
    const cleanUpdates = { ...updates };
    if (cleanUpdates.category_id === '') {
      cleanUpdates.category_id = null;
    }
    const { data, error } = await supabase
      .from('links')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getCategories() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;

    if (!data || data.length === 0) {
      const defaultCategories = [
        { name: 'vestuario', user_id: user.id },
        { name: 'eletrônicos', user_id: user.id },
        { name: 'Automotivo', user_id: user.id },
        { name: 'Calçado', user_id: user.id },
        { name: 'Casa', user_id: user.id },
        { name: 'Construção', user_id: user.id },
        { name: 'Ferramentas', user_id: user.id },
        { name: 'outros', user_id: user.id }
      ];

      const { data: insertedData, error: insertError } = await supabase
        .from('categories')
        .insert(defaultCategories)
        .select();

      if (insertError) throw insertError;
      return (insertedData || []) as Category[];
    }

    return data as Category[];
  }
};
