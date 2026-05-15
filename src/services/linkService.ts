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
    const { data, error } = await supabase
      .from('links')
      .insert([link])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Link>) {
    const { data, error } = await supabase
      .from('links')
      .update(updates)
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
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Category[];
  }
};
