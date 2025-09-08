import axios from "axios";
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
});
export function setAuthToken(jwt: string | null) {
    if (jwt) api.defaults.headers.common.Authorization = `Bearer ${jwt}`;
    else delete api.defaults.headers.common.Authorization;
}
