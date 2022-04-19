import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const addCart = [...cart]

      const isAlreadyInCart = addCart.find(product => product.id === productId)

      const stock = await api.get(`/stock/${productId}`)

      const stockAmount = stock.data.amount

      const currentAmount = isAlreadyInCart ? isAlreadyInCart.amount : 0;

      const amount = currentAmount + 1

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(isAlreadyInCart){
        isAlreadyInCart.amount = amount
      } else {
        const product = await api.get(`/products/${productId}`)

        const newProduct = {...product.data, amount: 1}
        addCart.push(newProduct)
      }
      
    setCart(addCart)
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(addCart))

    } catch {
      toast.error('Erro na adição do produto');
    }

    
  };

  const removeProduct = (productId: number) => {
    try {
      const removeCart = [...cart]
      const indCart = removeCart.findIndex(product => product.id === productId)
      if(indCart >= 0){
        removeCart.splice(indCart, 1)
        setCart(removeCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0 ){
        return;
      }

      const stockItem = await api.get(`/stock/${productId}`)
      const stockAmount = stockItem.data.amount

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }


      const updateCart = [...cart]
      const productExist = updateCart.find(product => product.id === productId)

      if(productExist){
        productExist.amount = amount
        setCart(updateCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
