import axios from "axios";

import { api } from "./api";

const GUEST_TOKEN_KEY = "regif_shop_guest_orders_token";

export function getShopGuestOrdersToken(): string | null {
  try {
    return sessionStorage.getItem(GUEST_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setShopGuestOrdersToken(token: string) {
  sessionStorage.setItem(GUEST_TOKEN_KEY, token);
}

export function clearShopGuestOrdersToken() {
  sessionStorage.removeItem(GUEST_TOKEN_KEY);
}

/** Cliente HTTP só para rotas `/shop/public/guest-orders` (não envia token do painel admin). */
export const shopGuestApi = axios.create({
  baseURL: api.defaults.baseURL,
  timeout: 10000,
  withCredentials: true,
});

shopGuestApi.interceptors.request.use((config) => {
  const t = getShopGuestOrdersToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});
