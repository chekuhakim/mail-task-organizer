
// This file allows using a custom Supabase instance
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Default values (fallback)
const DEFAULT_SUPABASE_URL = "https://rytpbfpgkswojbsyankv.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dHBiZnBna3N3b2pic3lhbmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4ODkxODUsImV4cCI6MjA2MDQ2NTE4NX0.N-BjgX2y7oD92mxADLmY9Hk93t10t92it1L0GvyHAk0";

// Get custom configuration from localStorage
const getSupabaseConfig = () => {
  const url = localStorage.getItem("supabase_url");
  const key = localStorage.getItem("supabase_key");
  
  return {
    url: url || DEFAULT_SUPABASE_URL,
    key: key || DEFAULT_SUPABASE_KEY
  };
};

const config = getSupabaseConfig();

export const supabase = createClient<Database>(config.url, config.key);

// Function to reinitialize the client with new configuration
export const reinitializeSupabaseClient = (url: string, key: string) => {
  localStorage.setItem("supabase_url", url);
  localStorage.setItem("supabase_key", key);
  window.location.reload(); // Force reload to create a new client
};
