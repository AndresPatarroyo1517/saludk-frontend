"use client";
import React, { createContext, useContext, useReducer, useEffect } from 'react';


const CartStateContext = createContext<any>({ items: [] });
const CartDispatchContext = createContext<React.Dispatch<any>>(() => undefined);


const initialState = {
items: [] // { id, title, price, qty, image, meta }
};

function reducer(state: any, action: any) {
    switch (action.type) {
        case 'HYDRATE':
            return { ...state, ...action.payload };
        case 'ADD_ITEM': {
            const existing = state.items.find((i: any) => i.id === action.payload.id);
            if (existing) {
                return {
                    ...state,
                    items: state.items.map((i: any) => i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i)
                };
            }
            return { ...state, items: [...state.items, { ...action.payload, qty: 1 }] };
        }
        case 'REMOVE_ITEM':
            return { ...state, items: state.items.filter((i: any) => i.id !== action.payload) };
        case 'SET_QTY':
            return { ...state, items: state.items.map((i: any) => i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i).filter((i: any) => i.qty > 0) };
        case 'CLEAR':
            return { ...state, items: [] };
        default:
            throw new Error('Unknown action: ' + action.type);
    }
}


export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);


    // Hydrate from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem('pharmacy_cart');
            if (raw) {
                dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) });
            }
        } catch (e) {
            console.error('Error hydrating cart', e);
        }
    }, []);


    // Persist
    useEffect(() => {
        try {
            localStorage.setItem('pharmacy_cart', JSON.stringify(state));
        } catch (e) {
            console.error('Error saving cart', e);
        }
    }, [state]);


    return (
        <CartDispatchContext.Provider value={dispatch}>
            <CartStateContext.Provider value={state}>
                {children}
            </CartStateContext.Provider>
        </CartDispatchContext.Provider>
    );
}


export function useCart() {
    return useContext(CartStateContext);
}
export function useDispatchCart() {
    return useContext(CartDispatchContext);
}