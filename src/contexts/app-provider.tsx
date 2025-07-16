
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { DataProfile, RegisteredUser, Delivery, Invoice, AddUserDataPayload } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";

interface AppContextType {
  user: User | null;
  customerData: DataProfile | null;
  login: (emailOrName: string, pass: string) => Promise<{ success: boolean; error: string | null; userType: 'admin' | 'customer' | null }>;
  logout: () => Promise<void>;
  
  // Admin-specific data
  dataProfiles: DataProfile[];
  registeredUsers: RegisteredUser[];
  invoices: Invoice[];
  
  loading: boolean;
  
  // Admin actions
  addUserData: (data: AddUserDataPayload) => Promise<void>;
  addDataProfile: (name: string) => Promise<void>;
  deleteDataProfile: (profileId: string) => Promise<void>;
  updateProfileDelivery: (profileId: string, deliveryId: string, newDate: string) => Promise<void>;
  deleteProfileDelivery: (profileId: string, deliveryId: string) => Promise<void>;
  removeDuplicateDeliveries: (profileId: string) => Promise<void>;
  updateUserBottlePrice: (profileName: string, newPrice: number) => Promise<void>;
  linkProfileToUser: (profileId: string, userId: string) => Promise<void>;
  unlinkProfile: (profileId: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "profileId">) => Promise<Invoice | undefined>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  customerData: null,
  login: async () => ({ success: false, error: "Not implemented", userType: null }),
  logout: async () => {},
  dataProfiles: [],
  registeredUsers: [],
  invoices: [],
  loading: true,
  addUserData: async () => {},
  addDataProfile: async () => {},
  deleteDataProfile: async () => {},
  updateProfileDelivery: async () => {},
  deleteProfileDelivery: async () => {},
  removeDuplicateDeliveries: async () => {},
  updateUserBottlePrice: async () => {},
  linkProfileToUser: async () => {},
  unlinkProfile: async () => {},
  addInvoice: async () => undefined,
  deleteInvoice: async () => {},
  refreshData: async () => {},
});

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin2007";


async function setupDatabaseSchema() {
    // 1. Create data_profiles table
    const { error: createProfilesError } = await supabase.rpc('run_sql', {
        sql: `
            CREATE TABLE IF NOT EXISTS public.data_profiles (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                name text NOT NULL,
                bottle_price numeric NULL DEFAULT 100,
                can_share_report boolean NULL DEFAULT false,
                linked_user_id uuid NULL,
                CONSTRAINT data_profiles_pkey PRIMARY KEY (id),
                CONSTRAINT data_profiles_name_key UNIQUE (name),
                CONSTRAINT data_profiles_linked_user_id_fkey FOREIGN KEY (linked_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
            );
        `
    });
    if (createProfilesError) console.error("DB_SETUP: Failed to create data_profiles:", createProfilesError.message);

    // 2. Create deliveries table
    const { error: createDeliveriesError } = await supabase.rpc('run_sql', {
        sql: `
            CREATE TABLE IF NOT EXISTS public.deliveries (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                profile_id uuid NOT NULL,
                date date NOT NULL,
                bottles integer NOT NULL,
                CONSTRAINT deliveries_pkey PRIMARY KEY (id),
                CONSTRAINT deliveries_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.data_profiles(id) ON DELETE CASCADE
            );
        `
    });
    if (createDeliveriesError) console.error("DB_SETUP: Failed to create deliveries:", createDeliveriesError.message);

    // 3. Create invoices table
    const { error: createInvoicesError } = await supabase.rpc('run_sql', {
        sql: `
            CREATE TABLE IF NOT EXISTS public.invoices (
                id uuid NOT NULL DEFAULT gen_random_uuid(),
                profile_id uuid NOT NULL,
                amount numeric NOT NULL,
                month text NOT NULL,
                payment_method text NULL,
                recipient_number text NULL,
                created_at timestamp with time zone NULL DEFAULT now(),
                CONSTRAINT invoices_pkey PRIMARY KEY (id),
                CONSTRAINT invoices_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.data_profiles(id) ON DELETE CASCADE
            );
        `
    });
    if (createInvoicesError) console.error("DB_SETUP: Failed to create invoices:", createInvoicesError.message);
    
    // 4. Create users_public view to safely expose user emails
    const { error: createViewError } = await supabase.rpc('run_sql', {
        sql: `
            CREATE OR REPLACE VIEW public.users_public AS
            SELECT id, email
            FROM auth.users;
        `
    });
    if (createViewError) console.error("DB_SETUP: Failed to create users_public view:", createViewError.message);

    console.log("Database schema setup complete.");
}


export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customerData, setCustomerData] = useState<DataProfile | null>(null);
  const [dataProfiles, setDataProfiles] = useState<DataProfile[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllAdminData = useCallback(async () => {
    // Step 1: Fetch all data profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('data_profiles')
      .select('id, name, bottle_price, can_share_report, linked_user_id')
      .order('name', { ascending: true });

    if (profilesError) throw profilesError;

    // Step 2: Fetch all deliveries
    const { data: deliveriesData, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('id, profile_id, date, bottles')
      .order('date', { ascending: false });

    if (deliveriesError) throw deliveriesError;
    
    // Step 3: Map deliveries to their respective profiles
    const profilesWithDeliveries = profilesData.map(profile => {
        const profileDeliveries = (deliveriesData || [])
            .filter(delivery => delivery.profile_id === profile.id)
            .map(d => ({
                id: d.id,
                date: d.date,
                bottles: d.bottles,
                month: format(new Date(d.date), 'MMMM')
            }));

        return {
            id: profile.id,
            name: profile.name,
            bottlePrice: profile.bottle_price,
            canShareReport: profile.can_share_report,
            linked_user_id: profile.linked_user_id,
            deliveries: profileDeliveries,
        };
    });
    
    setDataProfiles(profilesWithDeliveries as DataProfile[]);

    // Fetch registered users (customers)
    const { data: registeredUsersData, error: registeredUsersError } = await supabase
        .from('users_public')
        .select('id, email');
    if (registeredUsersError) throw registeredUsersError;
    setRegisteredUsers(registeredUsersData as RegisteredUser[]);

    // Fetch invoices
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (invoicesError) throw invoicesError;

    const formattedInvoices = invoicesData.map(inv => {
        const associatedProfile = profilesWithDeliveries.find(p => p.id === inv.profile_id);
        const deliveriesForInvoice = associatedProfile?.deliveries.filter(d => {
            const deliveryDate = new Date(d.date);
            return deliveryDate.toLocaleString('default', { month: 'long' }) === inv.month;
        }) || [];
        return {
            id: inv.id,
            profileId: inv.profile_id,
            name: associatedProfile?.name || 'Unknown Profile',
            amount: inv.amount,
            bottlePrice: associatedProfile?.bottlePrice,
            paymentMethod: inv.payment_method,
            recipientNumber: inv.recipient_number,
            createdAt: inv.created_at,
            month: inv.month,
            deliveries: deliveriesForInvoice
        } as Invoice;
    })
    setInvoices(formattedInvoices);
  }, []);
  
  const fetchCustomerData = useCallback(async (userId: string) => {
      // Step 1: Fetch the linked data profile
      const { data: profileData, error: profileError } = await supabase
        .from('data_profiles')
        .select(`id, name, bottle_price, can_share_report`)
        .eq('linked_user_id', userId)
        .single();
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
            setCustomerData(null);
            return;
        }
        throw profileError;
      };

      // Step 2: Fetch deliveries for that profile
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('id, date, bottles')
        .eq('profile_id', profileData.id)
        .order('date', { ascending: false });
      
      if (deliveriesError) throw deliveriesError;
      
      const formattedCustomerData = {
          id: profileData.id,
          name: profileData.name,
          bottlePrice: profileData.bottle_price,
          canShareReport: profileData.can_share_report,
          deliveries: (deliveriesData || []).map(d => ({
              ...d,
              month: format(new Date(d.date), 'MMMM')
          })),
      }
      setCustomerData(formattedCustomerData as DataProfile);
  }, []);

  const handleAuthChange = useCallback(async (_event: string, session: any) => {
    setLoading(true);
    setUser(session?.user ?? null);
    if (session?.user) {
        const userType = session.user.user_metadata.user_type;
        try {
            if (userType === 'admin') {
                await fetchAllAdminData();
            } else if (userType === 'customer') {
                await fetchCustomerData(session.user.id);
            }
        } catch (error: any) {
            console.error("Error fetching data on auth change:", error.message || error);
            // Optionally set an error state here to show in the UI
        }
    } else {
        // Clear all state on logout
        setCustomerData(null);
        setDataProfiles([]);
        setInvoices([]);
        setRegisteredUsers([]);
    }
    setLoading(false);
  }, [fetchAllAdminData, fetchCustomerData]);

  useEffect(() => {
    const initApp = async () => {
        await setupDatabaseSchema();
        const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);
        await supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuthChange("INITIAL_SESSION", session)
        });
        return () => {
          authListener.subscription.unsubscribe();
        };
    };
    initApp();
  }, [handleAuthChange]);

  const login = async (emailOrName: string, password: string): Promise<{ success: boolean; error: string | null; userType: 'admin' | 'customer' | null }> => {
    try {
      // Admin Login
      if (emailOrName.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          let { data, error } = await supabase.auth.signInWithPassword({ 
              email: ADMIN_EMAIL, 
              password: ADMIN_PASSWORD 
          });

          // If admin user doesn't exist, sign them up
          if (error?.message.includes("Invalid login credentials")) {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email: ADMIN_EMAIL,
                  password: ADMIN_PASSWORD,
                  options: { data: { user_type: 'admin' } }
              });
              if (signUpError) throw signUpError;
              data = signUpData;
          } else if (error) {
              throw error;
          }
          
          if (!data.user) throw new Error("Could not authenticate admin user.");
          
          // Ensure user_type is set correctly
          if (data.user.user_metadata.user_type !== 'admin') {
            const { error: updateError } = await supabase.auth.updateUser({ data: { user_type: 'admin' } });
            if(updateError) console.error("Failed to update user metadata for admin");
          }
          
          return { success: true, error: null, userType: 'admin' };
      }
      
      // Customer Login
      const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrName,
          password: password,
      });

      if (error) throw error;
      
      if (data.user?.user_metadata.user_type !== 'customer') {
        await supabase.auth.signOut();
        throw new Error("This email is not registered as a customer account.");
      }

      return { success: true, error: null, userType: 'customer' };

    } catch (error: any) {
        return { success: false, error: error.message || "An unexpected error occurred.", userType: null };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addDataProfile = async (name: string) => {
    const { data: existing } = await supabase.from('data_profiles').select('id').eq('name', name).single();
    if (existing) throw new Error(`Profile with name "${name}" already exists.`);

    const { error } = await supabase.from('data_profiles').insert({ name, bottle_price: 100, can_share_report: false });
    if (error) throw error;
    await fetchAllAdminData();
  };

  const deleteDataProfile = async (profileId: string) => {
    const { error } = await supabase.from('data_profiles').delete().eq('id', profileId);
    if (error) throw error;
    await fetchAllAdminData();
  };

  const linkProfileToUser = async (profileId: string, userId: string) => {
    const { error } = await supabase.from('data_profiles').update({ linked_user_id: userId }).eq('id', profileId);
    if (error) throw error;
    await fetchAllAdminData();
  };
  
  const unlinkProfile = async (profileId: string) => {
    const { error } = await supabase.from('data_profiles').update({ linked_user_id: null }).eq('id', profileId);
    if (error) throw error;
    await fetchAllAdminData();
  };

  const addUserData = async (data: AddUserDataPayload) => {
    const { data: profile } = await supabase.from('data_profiles').select('id').eq('name', data.name).single();
    if (!profile) throw new Error("Data profile does not exist.");

    const { error } = await supabase.from('deliveries').insert({ profile_id: profile.id, date: data.date, bottles: data.bottles });
    if (error) throw error;
    await refreshData();
  };

  const updateUserBottlePrice = async (profileName: string, newPrice: number) => {
    const { error } = await supabase.from('data_profiles').update({ bottle_price: newPrice }).eq('name', profileName);
    if (error) throw error;
    await refreshData();
  };

  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt" | "profileId">): Promise<Invoice | undefined> => {
    const profileToInvoice = dataProfiles.find(p => p.name.toLowerCase() === invoiceData.name.toLowerCase());
    if (!profileToInvoice) {
        throw new Error("Cannot create invoice for non-existent profile.");
    };

    const { data, error } = await supabase
        .from('invoices')
        .insert({
            profile_id: profileToInvoice.id,
            amount: invoiceData.amount,
            month: invoiceData.month,
            payment_method: invoiceData.paymentMethod,
            recipient_number: invoiceData.recipientNumber,
        })
        .select()
        .single();
    
    if (error) throw error;

    const newInvoice: Invoice = {
        id: data.id,
        profileId: data.profile_id,
        name: profileToInvoice.name,
        amount: data.amount,
        bottlePrice: profileToInvoice.bottlePrice,
        paymentMethod: data.payment_method,
        recipientNumber: data.recipient_number,
        createdAt: data.created_at,
        month: data.month,
        deliveries: invoiceData.deliveries || []
    };
    
    setInvoices(prev => [newInvoice, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    return newInvoice;
  }
  
  const deleteInvoice = async (invoiceId: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
  }

  const updateProfileDelivery = async (profileId: string, deliveryId: string, newDate: string) => {
    const { error } = await supabase.from('deliveries').update({ date: newDate }).eq('id', deliveryId);
    if (error) throw error;
    await refreshData();
  };

  const deleteProfileDelivery = async (profileId: string, deliveryId: string) => {
    const { error } = await supabase.from('deliveries').delete().eq('id', deliveryId);
    if (error) throw error;
    await refreshData();
  }

  const removeDuplicateDeliveries = async (profileId: string) => {
    const profile = dataProfiles.find(p => p.id === profileId);
    if (!profile) return;

    const uniqueDeliveries = new Map<string, Delivery>();
    profile.deliveries.forEach(delivery => {
        const key = `${delivery.date}-${delivery.bottles}`;
        if (!uniqueDeliveries.has(key)) uniqueDeliveries.set(key, delivery);
    });

    const deliveriesToDelete = profile.deliveries.filter(d => !Array.from(uniqueDeliveries.values()).find(ud => ud.id === d.id));
    if (deliveriesToDelete.length === 0) return;

    const idsToDelete = deliveriesToDelete.map(d => d.id);
    const { error } = await supabase.from('deliveries').delete().in('id', idsToDelete);
    if (error) throw error;
    
    await refreshData();
  }
  
  const refreshData = async () => {
    setLoading(true);
    try {
        if (user?.user_metadata.user_type === 'customer') {
            await fetchCustomerData(user.id);
        } else if (user?.user_metadata.user_type === 'admin') {
            await fetchAllAdminData();
        }
    } catch(error) {
        console.error("Failed to refresh data:", error);
    } finally {
        setLoading(false);
    }
  }

  const value = {
    user,
    customerData,
    login,
    logout,
    dataProfiles,
    registeredUsers,
    loading,
    addUserData,
    addDataProfile,
    deleteDataProfile,
    updateProfileDelivery,
    deleteProfileDelivery,
    removeDuplicateDeliveries,
    updateUserBottlePrice,
    linkProfileToUser,
    unlinkProfile,
    invoices,
    addInvoice,
    deleteInvoice,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
