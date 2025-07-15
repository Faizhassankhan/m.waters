
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { UserData, Delivery, Invoice, AddUserDataPayload } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { PostgrestError, User } from "@supabase/supabase-js";
import { format } from "date-fns";

interface AppContextType {
  user: User | null;
  login: (pass: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  users: UserData[];
  loading: boolean;
  addUserData: (data: AddUserDataPayload) => Promise<void>;
  updateUserDelivery: (userName: string, deliveryId: string, newDate: string) => Promise<void>;
  deleteUserDelivery: (userName: string, deliveryId: string) => Promise<void>;
  removeDuplicateDeliveries: (userName: string) => Promise<void>;
  updateUserBottlePrice: (userName: string, newPrice: number) => Promise<void>;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "userId">) => Promise<Invoice | null>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  login: async () => ({ success: false, error: "Not implemented" }),
  logout: async () => {},
  users: [],
  loading: true,
  addUserData: async () => {},
  updateUserDelivery: async () => {},
  deleteUserDelivery: async () => {},
  removeDuplicateDeliveries: async () => {},
  updateUserBottlePrice: async () => {},
  invoices: [],
  addInvoice: async () => null,
  deleteInvoice: async () => {},
  refreshData: async () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch users and their deliveries in one go
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          bottle_price,
          deliveries (
            id,
            date,
            bottles
          )
        `)
        .order('name', { ascending: true });

      if (usersError) throw usersError;

      const formattedUsers = usersData.map(u => ({
        id: u.id,
        name: u.name,
        bottlePrice: u.bottle_price,
        // Ensure deliveries are sorted by date
        deliveries: (u.deliveries || []).map(d => ({
            ...d,
            month: format(new Date(d.date), 'MMMM') // Add month property dynamically
        })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      }));
      setUsers(formattedUsers as UserData[]);

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      const formattedInvoices = invoicesData.map(inv => {
          const associatedUser = formattedUsers.find(u => u.id === inv.user_id);
          const deliveriesForInvoice = associatedUser?.deliveries.filter(d => {
              const deliveryDate = new Date(d.date);
              return deliveryDate.toLocaleString('default', { month: 'long' }) === inv.month;
          }) || [];
          return {
              id: inv.id,
              userId: inv.user_id,
              name: associatedUser?.name || 'Unknown User',
              amount: inv.amount,
              paymentMethod: inv.payment_method,
              recipientNumber: inv.recipient_number,
              createdAt: inv.created_at,
              month: inv.month,
              deliveries: deliveriesForInvoice
          } as Invoice;
      })

      setInvoices(formattedInvoices);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
            await fetchAllData();
        } else {
            setLoading(false);
        }
    };
    
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
            fetchAllData();
        } else {
            setUsers([]);
            setInvoices([]);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (password: string) => {
    // Note: It's recommended to create a user in Supabase with this email.
    const email = "admin@aquamanager.com";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return { success: false, error: error.message };
    }
    await fetchAllData();
    return { success: true, error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsers([]);
    setInvoices([]);
  };

  const addUserData = async (data: AddUserDataPayload) => {
    let userId;

    // Check if user exists, if not, create them
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('name', data.name)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ name: data.name, bottle_price: 150 }) // default price
        .select('id')
        .single();
      if (userError) throw userError;
      userId = newUser.id;
    }

    // Add the delivery record
    const { error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        user_id: userId,
        date: data.date,
        bottles: data.bottles,
      });

    if (deliveryError) throw deliveryError;

    // Refresh all data to reflect changes
    await fetchAllData();
  };

  const updateUserBottlePrice = async (userName: string, newPrice: number) => {
    const userToUpdate = users.find(u => u.name === userName);
    if (!userToUpdate) throw new Error("User not found");

    const { error } = await supabase
      .from('users')
      .update({ bottle_price: newPrice })
      .eq('id', userToUpdate.id);
    
    if (error) throw error;
    await fetchAllData();
  };

  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt" | "userId">): Promise<Invoice | null> => {
    const userToInvoice = users.find(u => u.name.toLowerCase() === invoiceData.name.toLowerCase());
    if (!userToInvoice) {
        console.error("Cannot create invoice for non-existent user.");
        return null;
    }

    const { data, error } = await supabase
        .from('invoices')
        .insert({
            user_id: userToInvoice.id,
            amount: invoiceData.amount,
            month: invoiceData.month,
            payment_method: invoiceData.paymentMethod,
            recipient_number: invoiceData.recipientNumber,
        })
        .select()
        .single();
    
    if (error) throw error;
    
    await fetchAllData();

    return {
        id: data.id,
        userId: data.user_id,
        name: userToInvoice.name,
        amount: data.amount,
        paymentMethod: data.payment_method,
        recipientNumber: data.recipient_number,
        createdAt: data.created_at,
        month: data.month,
        deliveries: invoiceData.deliveries || []
    };
  }
  
  const deleteInvoice = async (invoiceId: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;
      await fetchAllData();
  }

  const updateUserDelivery = async (userName: string, deliveryId: string, newDate: string) => {
    const { error } = await supabase
        .from('deliveries')
        .update({ date: newDate })
        .eq('id', deliveryId);
    
    if (error) throw error;
    await fetchAllData();
  };

  const deleteUserDelivery = async (userName: string, deliveryId: string) => {
    const { error } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', deliveryId);
    
    if (error) throw error;
    await fetchAllData();
  }

  const removeDuplicateDeliveries = async (userName: string) => {
    const userToRemoveDuplicates = users.find(u => u.name === userName);
    if (!userToRemoveDuplicates) return;

    const uniqueDeliveries = new Map<string, Delivery>();
    userToRemoveDuplicates.deliveries.forEach(delivery => {
        const key = `${delivery.date}-${delivery.bottles}`;
        if (!uniqueDeliveries.has(key)) {
            uniqueDeliveries.set(key, delivery);
        }
    });

    const deliveriesToDelete = userToRemoveDuplicates.deliveries
        .filter(d => !Array.from(uniqueDeliveries.values()).find(ud => ud.id === d.id));

    if (deliveriesToDelete.length > 0) {
        const idsToDelete = deliveriesToDelete.map(d => d.id);
        const { error } = await supabase
            .from('deliveries')
            .delete()
            .in('id', idsToDelete);
        
        if (error) throw error;
    }

    await fetchAllData();
  }

  const value = {
    user,
    login,
    logout,
    users,
    loading,
    addUserData,
    updateUserDelivery,
    deleteUserDelivery,
    removeDuplicateDeliveries,
    updateUserBottlePrice,
    invoices,
    addInvoice,
    deleteInvoice,
    refreshData: fetchAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
