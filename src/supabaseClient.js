import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// WORKOUT SPLITS CRUD OPERATIONS
// ============================================

/**
 * Fetch all splits for the current user
 */
export const fetchUserSplits = async (userId) => {
  const { data, error } = await supabase
    .from('workout_splits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching splits:', error);
    return [];
  }
  return data || [];
};

/**
 * Create a new split
 */
export const createSplit = async (userId, name) => {
  const { data, error } = await supabase
    .from('workout_splits')
    .insert({ user_id: userId, name })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating split:', error);
    return null;
  }
  return data;
};

/**
 * Update a split
 */
export const updateSplit = async (splitId, name) => {
  const { data, error } = await supabase
    .from('workout_splits')
    .update({ name })
    .eq('id', splitId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating split:', error);
    return null;
  }
  return data;
};

/**
 * Delete a split (sets all associated templates' split_id to NULL)
 */
export const deleteSplit = async (splitId) => {
  try {
    // First, set all templates with this split_id to NULL
    const { error: updateError } = await supabase
      .from('workout_templates')
      .update({ split_id: null })
      .eq('split_id', splitId);

    if (updateError) {
      console.error('Error updating templates:', updateError);
      throw updateError;
    }

    // Then delete the split
    const { error: deleteError } = await supabase
      .from('workout_splits')
      .delete()
      .eq('id', splitId);

    if (deleteError) {
      console.error('Error deleting split:', deleteError);
      throw deleteError;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSplit:', error);
    return false;
  }
};

/**
 * Update template's split assignment
 */
export const assignTemplateToSplit = async (templateId, splitId) => {
  const { data, error } = await supabase
    .from('workout_templates')
    .update({ split_id: splitId })
    .eq('id', templateId)
    .select()
    .single();
  
  if (error) {
    console.error('Error assigning template to split:', error);
    return null;
  }
  return data;
};
