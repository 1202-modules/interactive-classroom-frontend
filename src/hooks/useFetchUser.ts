import { AppDispatch } from "@/store/store"
import { useDispatch } from "react-redux"
import { useApi } from "./useApi";
import { useEffect } from "react";
import { setUser, setUserError, setUserLoading } from "@/store/userSlice";

export const useFetchUser = async () => {
    const dispatch = useDispatch<AppDispatch>();
    const api = useApi();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                dispatch(setUserLoading(true));
                const res = await api.get('/users/me');
                dispatch(setUser(res.data))
            } catch (e) {
                dispatch(setUserError("User loading failed"))
            } finally {
                dispatch(setUserLoading(false))
            }
        }

        fetchUser();
    }, [api, dispatch])
}