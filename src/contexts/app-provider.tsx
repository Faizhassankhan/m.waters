
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
  invoices: [],
  addInvoice: async () => undefined,
  deleteInvoice: async () => {},
  refreshData: async () => {},
});

const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@aquamanager.com";
const ADMIN_PASSWORD = "admin2007";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customerData, setCustomerData] = useState<DataProfile | null>(null);
  const [dataProfiles, setDataProfiles] = useState<DataProfile[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllAdminData = useCallback(async () => {
    // Fetch data profiles and their deliveries
    const { data: profilesData, error: profilesError } = await supabase
      .from('data_profiles')
      .select(`
        id,
        name,
        bottle_price,
        can_share_report,
        linked_user_id,
        deliveries (
          id,
          date,
          bottles
        )
      `)
      .order('name', { ascending: true });

    if (profilesError) throw profilesError;

    const formattedProfiles = profilesData.map(p => ({
      id: p.id,
      name: p.name,
      bottlePrice: p.bottle_price,
      canShareReport: p.can_share_report,
      linked_user_id: p.linked_user_id,
      deliveries: (p.deliveries || []).map(d => ({
          ...d,
          month: format(new Date(d.date), 'MMMM')
      })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }));
    setDataProfiles(formattedProfiles as DataProfile[]);

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
        const associatedProfile = formattedProfiles.find(p => p.id === inv.profile_id);
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
      const { data, error } = await supabase
        .from('data_profiles')
        .select(`
            id, name, bottle_price, can_share_report,
            deliveries (id, date, bottles)
        `)
        .eq('linked_user_id', userId)
        .single();
      
      if (error) {
        // It's not an error if a customer has no linked profile yet
        if (error.code === 'PGRST116') {
            setCustomerData(null);
            return;
        }
        throw error;
      };
      
      const formattedCustomerData = {
          id: data.id,
          name: data.name,
          bottlePrice: data.bottle_price,
          canShareReport: data.can_share_report,
          deliveries: (data.deliveries || []).map(d => ({
              ...d,
              month: format(new Date(d.date), 'MMMM')
          })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }
      setCustomerData(formattedCustomerData as DataProfile);
  }, []);

  const handleAuthChange = useCallback(async (_event: string, session: any) => {
    setLoading(true);
    setUser(session?.user ?? null);
    if (session?.user) {
        const userType = session.user.user_metadata.user_type;
        if (userType === 'admin') {
            await fetchAllAdminData();
        } else if (userType === 'customer') {
            await fetchCustomerData(session.user.id);
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
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);
    // Initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthChange("INITIAL_SESSION", session)
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [handleAuthChange]);

  const login = async (emailOrName: string, password: string): Promise<{ success: boolean; error: string | null; userType: 'admin' | 'customer' | null }> => {
      // Admin Login
      if (emailOrName.toLowerCase() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
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
              if (signUpError) return { success: false, error: signUpError.message, userType: null };
              data = signUpData;
          } else if (error) {
              return { success: false, error: error.message, userType: null };
          }
          
          if (!data.user) return { success: false, error: "Could not authenticate admin user.", userType: null };
          
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

      if (error) return { success: false, error: error.message, userType: null };
      if (data.user?.user_metadata.user_type !== 'customer') {
        return { success: false, error: "Not a customer account.", userType: null };
      }

      return { success: true, error: null, userType: 'customer' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addDataProfile = async (name: string) => {
    const { data: existing } = await supabase.from('data_profiles').select('id').eq('name', name).single();
    if (existing) throw new Error(`Profile with name "${name}" already exists.`);

    const { error } = await supabase.from('data_profiles').insert({ name, bottle_price: 100 });
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
    if (!profileToInvoice) throw new Error("Cannot create invoice for non-existent profile.");

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
    if (user?.user_metadata.user_type === 'customer') {
        await fetchCustomerData(user.id);
    } else if (user?.user_metadata.user_type === 'admin') {
        await fetchAllAdminData();
    }
    setLoading(false);
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
