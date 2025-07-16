
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { UserProfile, RegisteredUser, Delivery, Invoice, AddUserDataPayload } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { User, PostgrestError } from "@supabase/supabase-js";
import { format } from "date-fns";

interface AppContextType {
  user: User | null;
  customerData: UserProfile | null;
  login: (emailOrName: string, pass: string) => Promise<{ success: boolean; error: string | null; userType: 'admin' | 'customer' | null }>;
  logout: () => Promise<void>;
  
  // Admin-specific data
  userProfiles: UserProfile[];
  registeredUsers: RegisteredUser[];
  invoices: Invoice[];
  
  loading: boolean;
  
  // Admin actions
  addUserData: (data: AddUserDataPayload) => Promise<void>;
  addUserProfile: (name: string, userId: string) => Promise<void>;
  deleteUserProfile: (profileId: string) => Promise<void>;
  updateUserDelivery: (userId: string, deliveryId: string, newDate: string) => Promise<void>;
  deleteUserDelivery: (userId: string, deliveryId: string) => Promise<void>;
  removeDuplicateDeliveries: (userId: string) => Promise<void>;
  updateUserBottlePrice: (userName: string, newPrice: number) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "userId">) => Promise<Invoice | undefined>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  linkProfileToUser: (profileId: string, userId: string) => Promise<void>;
  unlinkProfile: (profileId: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  customerData: null,
  login: async () => ({ success: false, error: "Not implemented", userType: null }),
  logout: async () => {},
  userProfiles: [],
  registeredUsers: [],
  invoices: [],
  loading: true,
  addUserData: async () => {},
  addUserProfile: async () => {},
  deleteUserProfile: async () => {},
  updateUserDelivery: async () => {},
  deleteUserDelivery: async () => {},
  removeDuplicateDeliveries: async () => {},
  updateUserBottlePrice: async () => {},
  addInvoice: async () => undefined,
  deleteInvoice: async () => {},
  refreshData: async () => {},
  linkProfileToUser: async () => {},
  unlinkProfile: async () => {},
});

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin2007";


export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customerData, setCustomerData] = useState<UserProfile | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllAdminData = useCallback(async () => {
    // Step 1: Fetch all user profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('users')
      .select('id, name, bottle_price, can_share_report, linked_user_id')
      .order('name', { ascending: true });

    if (profilesError) throw profilesError;

    // Step 2: Fetch all deliveries
    const { data: deliveriesData, error: deliveriesError } = await supabase
      .from('deliveries')
      .select('id, user_id, date, bottles')
      .order('date', { ascending: false });

    if (deliveriesError) throw deliveriesError;
    
    // Step 3: Map deliveries to their respective profiles
    const profilesWithDeliveries = profilesData.map(profile => {
        const profileDeliveries = (deliveriesData || [])
            .filter(delivery => delivery.user_id === profile.id)
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
    
    setUserProfiles(profilesWithDeliveries as UserProfile[]);

    // Fetch registered users (customers from auth table)
    const { data: { users: authUsers }, error: authUsersError } = await supabase.auth.admin.listUsers();
    if (authUsersError) throw authUsersError;

    const customerUsers = authUsers
      .filter(u => u.user_metadata?.user_type === 'customer')
      .map(u => ({ id: u.id, email: u.email || '' }));
    setRegisteredUsers(customerUsers);

    // Fetch invoices
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (invoicesError) throw invoicesError;

    const formattedInvoices = invoicesData.map(inv => {
        const associatedProfile = profilesWithDeliveries.find(p => p.id === inv.user_id);
        const deliveriesForInvoice = associatedProfile?.deliveries.filter(d => {
            const deliveryDate = new Date(d.date);
            return deliveryDate.toLocaleString('default', { month: 'long' }) === inv.month;
        }) || [];
        return {
            id: inv.id,
            userId: inv.user_id,
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
      // Step 1: Find the profile linked to the user
      const { data: linkedProfile, error: linkError } = await supabase
          .from('users')
          .select('id')
          .eq('linked_user_id', userId)
          .single();

      if (linkError || !linkedProfile) {
          if (linkError && linkError.code !== 'PGRST116') console.error(linkError);
          setCustomerData(null);
          return;
      }

      // Step 2: Fetch the full profile data for that linked profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select(`id, name, bottle_price, can_share_report`)
        .eq('id', linkedProfile.id)
        .single();
      
      if (profileError) throw profileError;
      if (!profileData) {
        setCustomerData(null);
        return;
      }

      // Step 3: Fetch deliveries for that user profile
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('id, date, bottles')
        .eq('user_id', profileData.id)
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
      setCustomerData(formattedCustomerData as UserProfile);
  }, []);

  const handleAuthChange = useCallback(async (_event: string, session: any) => {
    setLoading(true);
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
        const userType = currentUser.user_metadata?.user_type;
        try {
            if (userType === 'admin') {
                await fetchAllAdminData();
            } else if (userType === 'customer') {
                await fetchCustomerData(currentUser.id);
            }
        } catch (error: any) {
            if (error.message.includes('relation "public.users" does not exist')) {
                 console.warn(
                    '%cDATABASE SCHEMA NOT DETECTED',
                    'color: #f87171; font-weight: bold; font-size: 14px;',
                    '\nIt looks like your database tables are not set up. Please run the SQL script provided to create the required tables.'
                );
            } else {
                console.error("Error fetching data on auth change:", error.message || error);
            }
        }
    } else {
        // Clear all state on logout
        setCustomerData(null);
        setUserProfiles([]);
        setInvoices([]);
        setRegisteredUsers([]);
    }
    setLoading(false);
  }, [fetchAllAdminData, fetchCustomerData]);


  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthChange("INITIAL_SESSION", session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
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
            await supabase.auth.admin.updateUserById(data.user.id, { user_metadata: { user_type: 'admin' } });
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

  const addUserProfile = async (name: string) => {
    const { data: existing } = await supabase.from('users').select('id').eq('name', name).single();
    if (existing) throw new Error(`User profile for this name already exists.`);

    const { error } = await supabase.from('users').insert({ name, bottle_price: 100, can_share_report: true });
    if (error) throw error;
    await fetchAllAdminData();
  };

  const deleteUserProfile = async (userId: string) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
    await fetchAllAdminData();
  };

  const addUserData = async (data: AddUserDataPayload) => {
    const { data: profile } = await supabase.from('users').select('id').eq('name', data.name).single();
    if (!profile) throw new Error("User profile does not exist.");

    const { error } = await supabase.from('deliveries').insert({ user_id: profile.id, date: data.date, bottles: data.bottles });
    if (error) throw error;
    await refreshData();
  };

  const updateUserBottlePrice = async (userName: string, newPrice: number) => {
    const { error } = await supabase.from('users').update({ bottle_price: newPrice }).eq('name', userName);
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

    const newInvoice: Invoice = {
        id: data.id,
        userId: data.user_id,
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
  
  const linkProfileToUser = async (profileId: string, userId: string) => {
      const { error } = await supabase.from('users').update({ linked_user_id: userId }).eq('id', profileId);
      if (error) throw error;
      await refreshData();
  }

  const unlinkProfile = async (profileId: string) => {
       const { error } = await supabase.from('users').update({ linked_user_id: null }).eq('id', profileId);
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
    userProfiles,
    registeredUsers,
    invoices,
    loading,
    addUserData,
    addUserProfile,
    deleteUserProfile,
    updateUserDelivery,
    deleteUserDelivery,
    removeDuplicateDeliveries,
    updateUserBottlePrice,
    addInvoice,
    deleteInvoice,
    refreshData,
    linkProfileToUser,
    unlinkProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
