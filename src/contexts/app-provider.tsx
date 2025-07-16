
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { UserData, Delivery, Invoice, AddUserDataPayload } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { PostgrestError, User } from "@supabase/supabase-js";
import { format } from "date-fns";

interface AppContextType {
  user: User | null;
  customer: UserData | null;
  login: (emailOrName: string, pass: string) => Promise<{ success: boolean; error: string | null; userType: 'admin' | 'customer' | null }>;
  logout: () => Promise<void>;
  users: UserData[];
  loading: boolean;
  addUserData: (data: AddUserDataPayload) => Promise<void>;
  addUser: (name: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserDelivery: (userName: string, deliveryId: string, newDate: string) => Promise<void>;
  deleteUserDelivery: (userName: string, deliveryId: string) => Promise<void>;
  removeDuplicateDeliveries: (userName: string) => Promise<void>;
  updateUserBottlePrice: (userName: string, newPrice: number) => Promise<void>;
  toggleUserSharing: (userId: string, canShare: boolean) => Promise<void>;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "userId">) => Promise<Invoice | undefined>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  customer: null,
  login: async () => ({ success: false, error: "Not implemented", userType: null }),
  logout: async () => {},
  users: [],
  loading: true,
  addUserData: async () => {},
  addUser: async () => {},
  deleteUser: async () => {},
  updateUserDelivery: async () => {},
  deleteUserDelivery: async () => {},
  removeDuplicateDeliveries: async () => {},
  updateUserBottlePrice: async () => {},
  toggleUserSharing: async () => {},
  invoices: [],
  addInvoice: async () => undefined,
  deleteInvoice: async () => {},
  refreshData: async () => {},
});

const ADMIN_EMAIL = "admin@aquamanager.com";
const ADMIN_PASSWORD = "admin2007";
const CUSTOMER_PASSWORD = "2025";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<UserData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllAdminData = async () => {
    // Fetch users and their deliveries in one go
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        bottle_price,
        can_share_report,
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
      canShareReport: u.can_share_report,
      deliveries: (u.deliveries || []).map(d => ({
          ...d,
          month: format(new Date(d.date), 'MMMM')
      })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
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
            bottlePrice: associatedUser?.bottlePrice,
            paymentMethod: inv.payment_method,
            recipientNumber: inv.recipient_number,
            createdAt: inv.created_at,
            month: inv.month,
            deliveries: deliveriesForInvoice
        } as Invoice;
    })
    setInvoices(formattedInvoices);
  };
  
  const fetchCustomerData = async (customerName: string) => {
      const { data, error } = await supabase
        .from('users')
        .select(`
            id, name, bottle_price, can_share_report,
            deliveries (id, date, bottles)
        `)
        .eq('name', customerName)
        .single();
      
      if (error) throw error;
      
      const formattedCustomer = {
          id: data.id,
          name: data.name,
          bottlePrice: data.bottle_price,
          canShareReport: data.can_share_report,
          deliveries: (data.deliveries || []).map(d => ({
              ...d,
              month: format(new Date(d.date), 'MMMM')
          })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }
      setCustomer(formattedCustomer as UserData);
  }

  const loadSession = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userType = session?.user?.user_metadata?.user_type;

      if (userType === 'customer') {
        const customerName = session?.user?.user_metadata?.name;
        setUser(session.user);
        await fetchCustomerData(customerName);
      } else if (session?.user) {
        setUser(session.user);
        await fetchAllAdminData();
      }
    } catch (error) {
      console.error("Error loading session:", error);
      // Clear session if there's an error
      await logout();
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const userType = session?.user?.user_metadata?.user_type;
        if (session?.user) {
            setUser(session.user);
            if (userType === 'customer') {
                const customerName = session.user.user_metadata?.name;
                fetchCustomerData(customerName);
            } else {
                fetchAllAdminData();
            }
        } else {
            setUser(null);
            setCustomer(null);
            setUsers([]);
            setInvoices([]);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (emailOrName: string, password: string) => {
      // Admin Login
      if (emailOrName.toLowerCase() === ADMIN_EMAIL) {
          if (password === ADMIN_PASSWORD) {
              let { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
                  email: ADMIN_EMAIL, 
                  password: ADMIN_PASSWORD 
              });

              // If admin user doesn't exist, sign them up
              if (authError?.message.includes("Invalid login credentials")) {
                  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                      email: ADMIN_EMAIL,
                      password: ADMIN_PASSWORD,
                      options: { data: { user_type: 'admin' } }
                  });
                  if (signUpError) return { success: false, error: signUpError.message, userType: null };
                  authData = signUpData;
              } else if (authError) {
                  return { success: false, error: authError.message, userType: null };
              }
              
              if (!authData.user) {
                 return { success: false, error: "Could not authenticate admin user.", userType: null };
              }

              // Ensure user_type is set correctly
              if (authData.user.user_metadata.user_type !== 'admin') {
                await supabase.auth.updateUser({ data: { user_type: 'admin' } });
              }
              
              setUser(authData.user);
              await fetchAllAdminData();
              return { success: true, error: null, userType: 'admin' };
          } else {
              return { success: false, error: "Invalid password for admin.", userType: null };
          }
      }
      
      // Customer Login
      if (password === CUSTOMER_PASSWORD) {
          const { data: customerData, error: customerError } = await supabase
              .from('users')
              .select('id, name')
              .eq('name', emailOrName)
              .single();

          if (customerError || !customerData) {
              return { success: false, error: "Invalid name or password.", userType: null };
          }

          // Use a dummy email for Supabase auth, as it's required.
          const customerEmail = `${customerData.name.replace(/\s+/g, '_').toLowerCase()}@aquamanager.customer`;
          
          // Sign up the user if they don't exist in auth, or sign them in.
          let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
              email: customerEmail,
              password: password
          });
          
          if (authError?.message.includes("Invalid login credentials")) {
              // User not in auth, sign them up
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email: customerEmail,
                  password: password,
                  options: {
                      data: {
                          user_type: 'customer',
                          name: customerData.name
                      }
                  }
              });
              if (signUpError) return { success: false, error: signUpError.message, userType: null };
              authData = signUpData;
          } else if (authError) {
              return { success: false, error: authError.message, userType: null };
          }
          
          setUser(authData.user);
          await fetchCustomerData(customerData.name);
          return { success: true, error: null, userType: 'customer' };
      }

      return { success: false, error: "Invalid name or password.", userType: null };
  };


  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCustomer(null);
    setUsers([]);
    setInvoices([]);
  };

  const addUser = async (name: string) => {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('name', name)
      .single();
    
    if (existingUser) {
        throw new Error(`User with name "${name}" already exists.`);
    }

    const { error } = await supabase
        .from('users')
        .insert({ name: name, bottle_price: 100, can_share_report: false });
    
    if (error) throw error;
    await fetchAllAdminData();
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
    await fetchAllAdminData();
  };
  
  const toggleUserSharing = async (userId: string, canShare: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ can_share_report: canShare })
      .eq('id', userId);
    if (error) throw error;
    await fetchAllAdminData();
  };

  const addUserData = async (data: AddUserDataPayload) => {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('name', data.name)
      .single();

    if (!existingUser) {
      throw new Error("User does not exist. Please add them from the 'Add User' page first.");
    }

    const { error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        user_id: existingUser.id,
        date: data.date,
        bottles: data.bottles,
      });

    if (deliveryError) throw deliveryError;
    await fetchAllAdminData();
  };

  const updateUserBottlePrice = async (userName: string, newPrice: number) => {
    const userToUpdate = users.find(u => u.name === userName);
    if (!userToUpdate) throw new Error("User not found");

    const { error } = await supabase
      .from('users')
      .update({ bottle_price: newPrice })
      .eq('id', userToUpdate.id);
    
    if (error) throw error;
    await fetchAllAdminData();
  };

  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt" | "userId">): Promise<Invoice | undefined> => {
    let userToInvoice = users.find(u => u.name.toLowerCase() === invoiceData.name.toLowerCase());

    if (!userToInvoice) {
        throw new Error("Cannot create invoice for non-existent user. Please add them first.");
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

    const newInvoice: Invoice = {
        id: data.id,
        userId: data.user_id,
        name: userToInvoice.name,
        amount: data.amount,
        bottlePrice: userToInvoice.bottlePrice,
        paymentMethod: data.payment_method,
        recipientNumber: data.recipient_number,
        createdAt: data.created_at,
        month: data.month,
        deliveries: invoiceData.deliveries || []
    };
    
    setInvoices(prev => [newInvoice, ...prev]);
    return newInvoice;
  }
  
  const deleteInvoice = async (invoiceId: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;
      await fetchAllAdminData();
  }

  const updateUserDelivery = async (userName: string, deliveryId: string, newDate: string) => {
    const { error } = await supabase
        .from('deliveries')
        .update({ date: newDate })
        .eq('id', deliveryId);
    
    if (error) throw error;
    await (customer ? fetchCustomerData(customer.name) : fetchAllAdminData());
  };

  const deleteUserDelivery = async (userName: string, deliveryId: string) => {
    const { error } = await supabase
        .from('deliveries')
        .delete()
        .eq('id', deliveryId);
    
    if (error) throw error;
    await (customer ? fetchCustomerData(customer.name) : fetchAllAdminData());
  }

  const removeDuplicateDeliveries = async (userName: string) => {
    const userToRemoveDuplicates = customer || users.find(u => u.name === userName);
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

    await (customer ? fetchCustomerData(customer.name) : fetchAllAdminData());
  }
  
  const refreshData = async () => {
    if (customer) {
        await fetchCustomerData(customer.name);
    } else {
        await fetchAllAdminData();
    }
  }


  const value = {
    user,
    customer,
    login,
    logout,
    users,
    loading,
    addUserData,
    addUser,
    deleteUser,
    updateUserDelivery,
    deleteUserDelivery,
    removeDuplicateDeliveries,
    updateUserBottlePrice,
    toggleUserSharing,
    invoices,
    addInvoice,
    deleteInvoice,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
