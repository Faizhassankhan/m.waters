
"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { UserData, Delivery, Invoice } from "@/lib/types";

interface AppContextType {
  isAuthenticated: boolean;
  login: (pass: string) => boolean;
  logout: () => void;
  users: UserData[];
  addUserData: (data: {
    name: string;
    month: string;
    date: string;
    bottles: number;
  }) => void;
  updateUserDelivery: (userName: string, deliveryId: string, newDate: string) => void;
  deleteUserDelivery: (userName: string, deliveryId: string) => void;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => Invoice;
  deleteInvoice: (invoiceId: string) => void;
}

export const AppContext = createContext<AppContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
  users: [],
  addUserData: () => {},
  updateUserDelivery: () => {},
  deleteUserDelivery: () => {},
  invoices: [],
  addInvoice: () => ({} as Invoice),
  deleteInvoice: () => {},
});

const MOCK_USERS: UserData[] = [
  {
    name: "John Doe",
    deliveries: [
      { id: "1", month: "January", date: "2024-01-15", bottles: 10 },
      { id: "2", month: "January", date: "2024-01-25", bottles: 12 },
      { id: "3", month: "February", date: "2024-02-10", bottles: 8 },
    ],
  },
  {
    name: "Jane Smith",
    deliveries: [
        { id: "4", month: "January", date: "2024-01-20", bottles: 5 },
    ],
  },
];

const MOCK_INVOICES: Invoice[] = [
    { id: "inv1", name: "John Doe", amount: 1500, paymentMethod: "EasyPaisa", recipientNumber: "03001234567", createdAt: new Date().toISOString(), month: 'January' },
];


export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const authStatus = localStorage.getItem("aquaManagerAuth") === "true";
      setIsAuthenticated(authStatus);

      const storedUsers = localStorage.getItem("aquaManagerUsers");
      setUsers(storedUsers ? JSON.parse(storedUsers) : MOCK_USERS);
      
      const storedInvoices = localStorage.getItem("aquaManagerInvoices");
      setInvoices(storedInvoices ? JSON.parse(storedInvoices) : MOCK_INVOICES);
    } catch (error) {
        // If localStorage is not available or fails, use mock data
        setUsers(MOCK_USERS);
        setInvoices(MOCK_INVOICES);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("aquaManagerAuth", String(isAuthenticated));
        localStorage.setItem("aquaManagerUsers", JSON.stringify(users));
        localStorage.setItem("aquaManagerInvoices", JSON.stringify(invoices));
      } catch (error) {
        console.warn("Could not write to localStorage");
      }
    }
  }, [isAuthenticated, users, invoices, isLoaded]);

  const login = (pass: string) => {
    // In a real app, username would also be checked.
    if (pass === "admin2007") {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const addUserData = (data: { name: string; month: string; date: string; bottles: number; }) => {
    setUsers((prevUsers) => {
      const newUsers = [...prevUsers];
      const userIndex = newUsers.findIndex((u) => u.name.toLowerCase() === data.name.toLowerCase());
      const newDelivery: Delivery = { id: new Date().toISOString(), ...data };

      if (userIndex > -1) {
        newUsers[userIndex].deliveries.push(newDelivery);
        // Sort deliveries by date
        newUsers[userIndex].deliveries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else {
        newUsers.push({ name: data.name, deliveries: [newDelivery] });
      }
      return newUsers;
    });
  };

  const updateUserDelivery = (userName: string, deliveryId: string, newDate: string) => {
    setUsers(prevUsers => {
      return prevUsers.map(user => {
        if (user.name === userName) {
          const updatedDeliveries = user.deliveries.map(delivery => {
            if (delivery.id === deliveryId) {
              return { ...delivery, date: newDate, month: new Date(newDate).toLocaleString('default', { month: 'long' }) };
            }
            return delivery;
          });
          // Sort deliveries after update
          updatedDeliveries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return { ...user, deliveries: updatedDeliveries };
        }
        return user;
      });
    });
  };
  
  const deleteUserDelivery = (userName: string, deliveryId: string) => {
    setUsers(prevUsers => {
        const newUsers = prevUsers.map(user => {
            if (user.name === userName) {
                const updatedDeliveries = user.deliveries.filter(delivery => delivery.id !== deliveryId);
                return { ...user, deliveries: updatedDeliveries };
            }
            return user;
        });
        // Optional: remove user if they have no deliveries left
        // return newUsers.filter(user => user.deliveries.length > 0);
        return newUsers;
    });
};

  const addInvoice = (invoiceData: Omit<Invoice, "id" | "createdAt">) => {
      const newInvoice: Invoice = {
        ...invoiceData,
        id: `inv_${new Date().getTime()}`,
        createdAt: new Date().toISOString(),
      };
      setInvoices(prev => [...prev, newInvoice].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      return newInvoice;
  }

  const deleteInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
  }

  const value = {
    isAuthenticated,
    login,
    logout,
    users,
    addUserData,
    updateUserDelivery,
    deleteUserDelivery,
    invoices,
    addInvoice,
    deleteInvoice
  };

  // Prevent rendering children until state is loaded from localStorage
  // to avoid hydration mismatch.
  if (!isLoaded) {
    return null;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
