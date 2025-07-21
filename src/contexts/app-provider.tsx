
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { UserProfile, Delivery, Invoice, AddUserDataPayload, MonthlyStatus, BillingRecord, Feedback } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { format, getMonth, getYear } from "date-fns";

interface AppContextType {
  user: User | null;
  customerData: UserProfile | null;
  login: (emailOrName: string, pass: string) => Promise<{ success: boolean; error: string | null; userType: 'admin' | 'customer' | null }>;
  logout: () => Promise<void>;
  
  userProfiles: UserProfile[];
  invoices: Invoice[];
  feedbacks: Feedback[];
  
  loading: boolean;
  
  addUserData: (data: AddUserDataPayload) => Promise<void>;
  addUserProfile: (name: string, email: string, password: string) => Promise<void>;
  deleteUserProfile: (profileId: string) => Promise<void>;
  updateUserDelivery: (userId: string, deliveryId: string, newDate: string) => Promise<void>;
  deleteUserDelivery: (userId: string, deliveryId: string) => Promise<void>;
  removeDuplicateDeliveries: (userId: string) => Promise<void>;
  updateUserBottlePrice: (userName: string, newPrice: number) => Promise<void>;
  updateUserName: (userId: string, newName: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt" | "userId" | "deliveries">, deliveries: Delivery[]) => Promise<Invoice | undefined>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  saveMonthlyStatus: (userId: string, month: number, year: number, status: 'paid' | 'not_paid_yet') => Promise<void>;
  deleteMonthlyStatus: (userId: string, month: number, year: number) => Promise<void>;
  saveBillingRecord: (record: { userId: string, month: number, year: number, amountPaid: number, totalBill: number }) => Promise<void>;
  deleteBillingRecord: (recordId: string) => Promise<void>;
  addFeedback: (feedbackText: string) => Promise<void>;
  deleteFeedback: (feedbackId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  customerData: null,
  login: async () => ({ success: false, error: "Not implemented", userType: null }),
  logout: async () => {},
  userProfiles: [],
  invoices: [],
  feedbacks: [],
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
  saveMonthlyStatus: async () => {},
  deleteMonthlyStatus: async () => {},
  saveBillingRecord: async () => {},
  deleteBillingRecord: async () => {},
  addFeedback: async () => {},
  deleteFeedback: async () => {},
  refreshData: async () => {},
});

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin2007";


export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customerData, setCustomerData] = useState<UserProfile | null>(null);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    // No need to set loading here to avoid screen flicker on minor updates
    try {
        const { data, error } = await supabase.rpc('get_all_user_data');

        if (error) {
            if (error.message.includes('function get_all_user_data() does not exist')) {
                 console.warn(
                    '%cDATABASE FUNCTION NOT DETECTED',
                    'color: #f87171; font-weight: bold; font-size: 14px;',
                    "The database function is not set up correctly. Please run the provided SQL script in your Supabase SQL Editor."
                );
                setUserProfiles([]);
                setInvoices([]);
                setCustomerData(null);
                setLoading(false);
                return;
            }
            throw error;
        }
        
        if (data && typeof data === 'object' && 'userProfiles' in data) {
            const allInvoices = (data.invoices || []).map((inv: any) => {
                const profile = (data.userProfiles || []).find((p: UserProfile) => p.id === inv.userId);
                const deliveriesForInvoice = profile?.deliveries.filter((d: Delivery) => {
                    const deliveryDate = new Date(d.date);
                    return getMonth(deliveryDate) === new Date(`${inv.month} 1, ${inv.year}`).getMonth() && getYear(deliveryDate) === inv.year;
                }) || [];
                return { ...inv, deliveries: deliveriesForInvoice };
            }).sort((a: Invoice, b: Invoice) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const processedUserProfiles = (data.userProfiles || []).map((profile: UserProfile) => ({
              ...profile,
              email: profile.email || '',
              deliveries: profile.deliveries || [],
              monthlyStatuses: profile.monthlyStatuses || [],
              billingRecords: profile.billingRecords || [],
            }));
            
            setUserProfiles(processedUserProfiles);
            setInvoices(allInvoices);
            setFeedbacks(data.feedbacks || []);

            const currentUserProfile = processedUserProfiles.find((p: UserProfile) => p.id === user?.id);
            if (currentUserProfile) {
                setCustomerData(currentUserProfile);
            } else {
                setCustomerData(null);
            }

        } else {
             setUserProfiles([]);
             setInvoices([]);
             setFeedbacks([]);
             setCustomerData(null);
             console.error("Error fetching application data: RPC returned invalid data. This may be a permission issue or the function may have failed silently.", data);
        }

    } catch (e: any) {
        console.error("Error fetching application data:", e.message || e);
        setUserProfiles([]);
        setInvoices([]);
        setFeedbacks([]);
        setCustomerData(null);
    } finally {
        setLoading(false);
    }
  }, [user?.id]);


  const handleAuthChange = useCallback(async (_event: string, session: any) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    setLoading(true);

    if (currentUser) {
        await fetchAllData();
    } else {
        setCustomerData(null);
        setUserProfiles([]);
        setInvoices([]);
        setFeedbacks([]);
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
            const { error: adminUpdateError } = await supabase.auth.admin.updateUserById(data.user.id, { user_metadata: { user_type: 'admin' } });
            if(adminUpdateError) console.error("Error setting user as admin:", adminUpdateError.message);
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
      if (profileError && profileError.code === 'PGRST116') { 
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

  const addUserProfile = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.rpc('create_new_user', {
        user_email: email,
        user_password: password,
        user_name: name
    });

    if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
    }
    
    await fetchAllData();
  };

  const deleteUserProfile = async (userId: string) => {
    const { error } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: userId });
    if (error) {
        console.error('RPC Error:', error);
        throw new Error(`Failed to delete user: ${error.message}`);
    }
    await fetchAllData();
  };

  const addUserData = async (data: AddUserDataPayload) => {
    const profile = userProfiles.find(p => p.name === data.name);
    if (!profile) throw new Error("User does not exist.");

    const { error } = await supabase.from('deliveries').insert({ user_id: profile.id, date: data.date, bottles: data.bottles });
    if (error) throw error;
    
    await fetchAllData();
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

  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt" | "userId" | "deliveries">, deliveries: Delivery[]): Promise<Invoice | undefined> => {
    const rpcPayload = {
      p_user_name: invoiceData.name,
      p_amount: invoiceData.amount,
      p_month: invoiceData.month,
      p_year: invoiceData.year,
      p_payment_method: invoiceData.paymentMethod,
      p_recipient_number: invoiceData.recipientNumber,
      p_previous_balance: invoiceData.previousBalance || 0,
    };
    
    const { data, error } = await supabase.rpc('create_invoice_and_get_details', rpcPayload);

    if (error) {
        console.error("RPC Error:", error);
        throw new Error(`Failed to create invoice: ${error.message}`);
    }

    if (!data || (data as any).error) {
        throw new Error(`Failed to create invoice: ${(data as any).error || 'No data returned from function.'}`);
    }
    
    const newInvoice = data as Invoice;
    
    await fetchAllData();
    
    return {
        ...newInvoice,
        deliveries,
    };
  }
  
  const deleteInvoice = async (invoiceId: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;
      setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoiceId));
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
  
  const saveMonthlyStatus = async (userId: string, month: number, year: number, status: 'paid' | 'not_paid_yet') => {
    const { error } = await supabase
        .from('monthly_statuses')
        .upsert(
            { user_id: userId, month, year, status },
            { onConflict: 'user_id,month,year' }
        );

    if (error) {
        console.error("Error saving status:", error);
        throw error;
    }
    
    await fetchAllData();
  };

  const deleteMonthlyStatus = async (userId: string, month: number, year: number) => {
      const { error } = await supabase
        .from('monthly_statuses')
        .delete()
        .match({ user_id: userId, month: month, year: year });

    if (error) {
        console.error("Error deleting status:", error);
        throw error;
    }
    await fetchAllData();
  }

  const saveBillingRecord = async (record: { userId: string, month: number, year: number, amountPaid: number, totalBill: number }) => {
    const { error } = await supabase
        .from('billing_records')
        .upsert(
            { 
                user_id: record.userId, 
                month: record.month, 
                year: record.year, 
                amount_paid: record.amountPaid,
                total_bill: record.totalBill
            },
            { onConflict: 'user_id,month,year' }
        );
    if (error) throw error;
    await fetchAllData();
  };

  const deleteBillingRecord = async (recordId: string) => {
      const { error } = await supabase
        .from('billing_records')
        .delete()
        .eq('id', recordId);
    if (error) throw error;
    await fetchAllData();
  }

  const addFeedback = async (feedbackText: string) => {
    if (!user) throw new Error("You must be logged in to submit feedback.");
    const { error } = await supabase.from('feedbacks').insert({
        user_id: user.id,
        feedback_text: feedbackText,
        user_name: customerData?.name || user.email, // Fallback to email if name is not available
    });
    if (error) throw error;
    await fetchAllData();
  };

  const deleteFeedback = async (feedbackId: string) => {
      const { error } = await supabase.from('feedbacks').delete().eq('id', feedbackId);
      if (error) throw error;
      await fetchAllData();
  };


  const refreshData = async () => {
    setLoading(true);
    await fetchAllData();
  }

  const value = {
    user,
    customerData,
    login,
    logout,
    userProfiles,
    invoices,
    feedbacks,
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
    saveMonthlyStatus,
    deleteMonthlyStatus,
    saveBillingRecord,
    deleteBillingRecord,
    addFeedback,
    deleteFeedback,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
