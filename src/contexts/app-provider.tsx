
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { UserProfile, Delivery, Invoice, AddUserDataPayload } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { format } from "date-fns";

interface AppContextType {
  user: User | null;
  customerData: UserProfile | null;
  login: (emailOrName: string, pass: string) => Promise<{ success: boolean; error: string | null; userType: 'admin' | 'customer' | null }>;
  logout: () => Promise<void>;
  
  userProfiles: UserProfile[];
  invoices: Invoice[];
  
  loading: boolean;
  
  addUserData: (data: AddUserDataPayload) => Promise<void>;
  addUserProfile: (name: string, email: string) => Promise<void>;
  deleteUserProfile: (profileId: string) => Promise<void>;
  updateUserDelivery: (userId: string, deliveryId: string, newDate: string) => Promise<void>;
  deleteUserDelivery: (userId: string, deliveryId: string) => Promise<void>;
  removeDuplicateDeliveries: (userId: string) => Promise<void>;
  updateUserBottlePrice: (userName: string, newPrice: number) => Promise<void>;
  updateUserName: (userId: string, newName: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "userId">) => Promise<Invoice | undefined>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  updateInvoiceStatus: (invoiceId: string, status: 'paid' | 'not_paid_yet') => Promise<void>;
  updateInvoiceVisibility: (invoiceId: string, isVisible: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  customerData: null,
  login: async () => ({ success: false, error: "Not implemented", userType: null }),
  logout: async () => {},
  userProfiles: [],
  invoices: [],
  loading: true,
  addUserData: async () => {},
  addUserProfile: async () => {},
  deleteUserProfile: async () => {},
  updateUserDelivery: async () => {},
  deleteUserDelivery: async () => {},
  removeDuplicateDeliveries: async () => {},
  updateUserBottlePrice: async () => {},
  updateUserName: async () => {},
  addInvoice: async () => undefined,
  deleteInvoice: async () => {},
  updateInvoiceStatus: async () => {},
  updateInvoiceVisibility: async () => {},
  refreshData: async () => {},
});

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin2007";


export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customerData, setCustomerData] = useState<UserProfile | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    // No need to set loading here to avoid screen flicker on minor updates
    try {
        const { data, error } = await supabase.rpc('get_all_user_data');

        if (error) {
            // Check for a specific error when the function doesn't exist yet
            if (error.message.includes('function get_all_user_data() does not exist')) {
                 console.warn(
                    '%cDATABASE FUNCTION NOT DETECTED',
                    'color: #f87171; font-weight: bold; font-size: 14px;',
                    "The database function is not set up correctly. Please run the provided SQL script in your Supabase SQL Editor."
                );
                // Set empty state to prevent app crash
                setUserProfiles([]);
                setInvoices([]);
                setCustomerData(null);
                setLoading(false);
                return;
            }
            throw error;
        }
        
        if (data && typeof data === 'object') {
            setUserProfiles(data.userProfiles || []);
            setInvoices(data.invoices || []);
            
            // Repopulate customer data with full invoice details
            if (data.customerData) {
                const customerInvoices = (data.invoices || []).filter((inv: Invoice) => inv.userId === data.customerData.id);
                setCustomerData({ ...data.customerData, invoices: customerInvoices });
            } else {
                setCustomerData(null);
            }

            // Post-process invoices to add delivery details for the preview components
            const allDeliveries = (data.userProfiles || []).flatMap((p: UserProfile) => p.deliveries);
            const processedInvoices = (data.invoices || []).map((inv: Invoice) => {
                const profile = data.userProfiles.find((p: UserProfile) => p.id === inv.userId);
                const deliveriesForInvoice = profile?.deliveries.filter((d: Delivery) => {
                    const deliveryDate = new Date(d.date);
                    return deliveryDate.toLocaleString('default', { month: 'long' }) === inv.month;
                }) || [];
                return { ...inv, deliveries: deliveriesForInvoice, bottlePrice: profile?.bottlePrice };
            });
            setInvoices(processedInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } else {
             setUserProfiles([]);
             setInvoices([]);
             setCustomerData(null);
             console.error("Error fetching application data: RPC returned invalid data. This may be a permission issue or the function may have failed silently.", data);
        }

    } catch (e: any) {
        console.error("Error fetching application data:", e.message || e);
        // Reset state on error to avoid inconsistent UI
        setUserProfiles([]);
        setInvoices([]);
        setCustomerData(null);
    } finally {
        setLoading(false);
    }
  }, []);


  const handleAuthChange = useCallback(async (_event: string, session: any) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    setLoading(true);

    if (currentUser) {
        await fetchAllData();
    } else {
        // Clear all state on logout
        setCustomerData(null);
        setUserProfiles([]);
        setInvoices([]);
        setLoading(false);
    }
  }, [fetchAllData]);


  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthChange("INITIAL_SESSION", session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [handleAuthChange]);


  const login = async (emailOrName: string, password: string): Promise<{ success: boolean; error: string | null; userType: 'admin' | 'customer' | null }> => {
    try {
      if (emailOrName.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          let { data, error } = await supabase.auth.signInWithPassword({ 
              email: ADMIN_EMAIL, 
              password: ADMIN_PASSWORD 
          });

          if (error?.message.includes("Invalid login credentials")) {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email: ADMIN_EMAIL,
                  password: ADMIN_PASSWORD,
                  options: { data: { user_type: 'admin' } }
              });
              if (signUpError) throw signUpError;
              
              if (signUpData.user) {
                  const { error: insertError } = await supabase.from('users').insert({ id: signUpData.user.id, name: 'Admin' });
                  if (insertError) throw new Error(`Could not create admin profile: ${insertError.message}`);
              }
              
              data = signUpData;
          } else if (error) {
              throw error;
          }
          
          if (!data.user) throw new Error("Could not authenticate admin user.");
          
          if (data.user.user_metadata.user_type !== 'admin') {
            await supabase.auth.admin.updateUserById(data.user.id, { user_metadata: { user_type: 'admin' } });
          }
          
          return { success: true, error: null, userType: 'admin' };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrName,
          password: password,
      });

      if (error) throw error;
      
      if (data.user?.user_metadata.user_type !== 'customer') {
        await supabase.auth.signOut();
        throw new Error("This email is not registered as a customer account.");
      }
      
      const { data: userProfile, error: profileError } = await supabase.from('users').select('id').eq('id', data.user.id).single();
      if (profileError && profileError.code === 'PGRST116') { // No profile exists, create one
          const { error: insertError } = await supabase.from('users').insert({ id: data.user.id, name: data.user.email?.split('@')[0] || 'New User' });
          if(insertError) throw insertError;
      } else if (profileError) {
          throw profileError;
      }

      return { success: true, error: null, userType: 'customer' };

    } catch (error: any) {
        return { success: false, error: error.message || "An unexpected error occurred.", userType: null };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCustomerData(null);
    setUserProfiles([]);
    setInvoices([]);
  };

  const addUserProfile = async (name: string, email: string) => {
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) {
        throw new Error("Admin not logged in. Cannot create user.");
    }
    
    const randomPassword = Math.random().toString(36).slice(-8);
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: randomPassword,
        options: {
            data: { user_type: 'customer' }
        }
    });

    if (signUpError) {
        await supabase.auth.setSession(adminSession);
        throw new Error(`Failed to create user auth account: ${signUpError.message}`);
    }
    if (!user) {
        await supabase.auth.setSession(adminSession);
        throw new Error("User object was not returned after sign up.");
    }

    const { error: insertError } = await supabase
        .from('users')
        .insert({ id: user.id, name: name });

    if (insertError) {
        console.error("Failed to create user profile, but auth user was created:", user.id);
        throw new Error(`User auth account was created, but profile failed: ${insertError.message}`);
    }
    
    await supabase.auth.setSession(adminSession);
    
    await fetchAllData();
  };

  const deleteUserProfile = async (userId: string) => {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    await fetchAllData();
  };

  const addUserData = async (data: AddUserDataPayload) => {
    const { data: profile } = await supabase.from('users').select('id').eq('name', data.name).single();
    if (!profile) throw new Error("User does not exist.");

    const { error } = await supabase.from('deliveries').insert({ user_id: profile.id, date: data.date, bottles: data.bottles });
    if (error) throw error;
    await refreshData();
  };

  const updateUserBottlePrice = async (userName: string, newPrice: number) => {
    const { error } = await supabase.from('users').update({ bottle_price: newPrice }).eq('name', userName);
    if (error) throw error;
    await refreshData();
  };

  const updateUserName = async (userId: string, newName: string) => {
    const { error } = await supabase.from('users').update({ name: newName }).eq('id', userId);
    if (error) throw error;
    await refreshData();
  };

  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt" | "userId">): Promise<Invoice | undefined> => {
    const profileToInvoice = userProfiles.find(p => p.name.toLowerCase() === invoiceData.name.toLowerCase());
    if (!profileToInvoice) {
        throw new Error("Cannot create invoice for non-existent user.");
    };

    const { data, error } = await supabase
        .from('invoices')
        .insert({
            user_id: profileToInvoice.id,
            amount: invoiceData.amount,
            month: invoiceData.month,
            payment_method: invoiceData.paymentMethod,
            recipient_number: invoiceData.recipientNumber,
        })
        .select()
        .single();
    
    if (error) throw error;

    await fetchAllData();
    const newInvoice = (await supabase.rpc('get_all_user_data')).data.invoices.find((i: Invoice) => i.id === data.id);
    return newInvoice;
  }
  
  const deleteInvoice = async (invoiceId: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
  }
  
  const updateInvoiceStatus = async (invoiceId: string, status: 'paid' | 'not_paid_yet') => {
    const { data, error } = await supabase
        .from('invoices')
        .update({ payment_status: status })
        .eq('id', invoiceId)
        .select()
        .single();

    if (error) throw error;
    
    // Update local state immediately for better UX
    setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
        ? { ...inv, paymentStatus: data.payment_status, showStatusToCustomer: data.show_status_to_customer } 
        : inv
    ));
  };
  
  const updateInvoiceVisibility = async (invoiceId: string, isVisible: boolean) => {
    const { data, error } = await supabase
        .from('invoices')
        .update({ show_status_to_customer: isVisible })
        .eq('id', invoiceId)
        .select()
        .single();
    
    if (error) throw error;
    
    setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
        ? { ...inv, paymentStatus: data.payment_status, showStatusToCustomer: data.show_status_to_customer } 
        : inv
    ));
  }

  const updateUserDelivery = async (userId: string, deliveryId: string, newDate: string) => {
    const { error } = await supabase.from('deliveries').update({ date: newDate }).eq('id', deliveryId).eq('user_id', userId);
    if (error) throw error;
    await refreshData();
  };

  const deleteUserDelivery = async (userId: string, deliveryId: string) => {
    const { error } = await supabase.from('deliveries').delete().eq('id', deliveryId).eq('user_id', userId);
    if (error) throw error;
    await refreshData();
  }

  const removeDuplicateDeliveries = async (userId: string) => {
    const profile = userProfiles.find(p => p.id === userId);
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
    await fetchAllData();
  }

  const value = {
    user,
    customerData,
    login,
    logout,
    userProfiles,
    invoices,
    loading,
    addUserData,
    addUserProfile,
    deleteUserProfile,
    updateUserDelivery,
    deleteUserDelivery,
    removeDuplicateDeliveries,
    updateUserBottlePrice,
    updateUserName,
    addInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    updateInvoiceVisibility,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
