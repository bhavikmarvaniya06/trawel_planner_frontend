import axios from "axios";

export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
export const getApiResourceUrl = (path) => new URL(
    path,
    /^https?:\/\//i.test(API_BASE_URL) ? API_BASE_URL : window.location.origin
).toString();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});


// Automatically attach JWT token
api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});


export default api;