import axios from "axios";
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
});
export function setAuthToken(jwt: string | null) {
    if (jwt) api.defaults.headers.common.Authorization = `Bearer ${jwt}`;
    else delete api.defaults.headers.common.Authorization;
}
